"""
GreenMind AI Service 
"""
import csv
import math
import os
import re
import tempfile
import unicodedata
import logging
import random
from typing import List, Dict, Any, Tuple, Optional

from pydantic import BaseModel, Field
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

from sentence_transformers import CrossEncoder

from config import *
from prompts import ANALYSIS_PROMPT, MAIN_PROMPT, TITLE_PROMPT, FOLLOWUP_PROMPT

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# TEXT NORMALIZATION

def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\u0640", "")
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)

    text = text.translate(str.maketrans({
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ى": "ي",
        "ؤ": "و",
        "ئ": "ي",
    }))

    text = re.sub(r"(.)\1{2,}", r"\1\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([?.!,;:،؛])", r"\1", text)
    text = re.sub(r"([?.!,;:،؛])(?=\S)", r"\1 ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text

class QueryAnalysis(BaseModel):
    domain: str = Field(description="Must be 'agricultural' or 'out_of_domain'")
    intent: str = Field(description="irrigation, fertilizer, disease_pest, soil, crop_advice, general")
    question_type: str = Field(description="frequency, timeline, steps, quantity, general")
    rewritten_query: str = Field(description="Standalone rewritten query")

# OUT OF DOMAIN DETECTION

_OUT_OF_DOMAIN_PATTERNS = re.compile(
    r"""
    كره\s*القدم|كرة\s*القدم|مباراه|مباراة|فريق|ملعب|لاعب|
    سياسه|سياسة|انتخاب|حكومه|حكومة|رئيس\s*جمهوريه|برلمان|
    اقتصاد|بورصه|بورصة|سهم|اسهم|أسهم|استثمار|عمله|عملة|
    طبخ|وصفه\s*اكل|وصفة\s*أكل|مطبخ|اكل\s*لذيذ|
    رياضه\s*بدنيه|جيم|تمارين\s*رياضيه|لياقه|
    فيلم|مسلسل|اغنيه|أغنية|موسيقي|موسيقى|نجم\s*مشهور|
    طقس\s*اليوم|درجه\s*الحراره\s*في|نشره\s*الاخبار|
    سفر|فندق|سياحه|رحله|
    football|soccer|basketball|cricket\s+match|tennis\s+match|
    politics|election|president|parliament|government\s+policy|
    stock\s+market|bitcoin|cryptocurrency|forex|investment|
    recipe|cooking|restaurant|chef|food\s+delivery|
    gym|workout|fitness|bodybuilding|
    movie|series|music|celebrity|actor|actress|
    weather\s+forecast|news\s+today|breaking\s+news|
    hotel|tourism|travel|vacation|flight
    """,
    re.VERBOSE | re.IGNORECASE,
)

def _is_out_of_domain_fast(text: str) -> bool:
    return bool(_OUT_OF_DOMAIN_PATTERNS.search(text))

class RAGEngine:
    def __init__(self):
        print("[RAGEngine] Initializing V3.7 (Stateful Keys + No-Repeat Follow-ups)...")

        self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        self.vector_store = self._load_or_build_vector_store()

        self.retriever = (
            self.vector_store.as_retriever(
                search_type="mmr",
                search_kwargs={"k": RERANK_TOP_N, "fetch_k": RETRIEVER_FETCH_K},
            ) if self.vector_store else None
        )

        try:
            self.reranker = CrossEncoder(
                RERANKER_MODEL,
                max_length=512,
                device="cuda" if USE_GPU else "cpu"
            )
        except Exception as e:
            logger.warning("Reranker could not be loaded, fallback mode will be used: %s", e)
            self.reranker = None

        # --- Stateful API Key Management ---
        self.api_keys = GROQ_API_KEYS if isinstance(GROQ_API_KEYS, list) else [GROQ_API_KEY]
        self.current_key_index = 0
        self._initialize_llm_clients()

        # --- NO-REPEAT FOLLOW-UP ---
        self.session_follow_ups: Dict[str, set] = {}

    def _initialize_llm_clients(self):
        """تهيئة النماذج باستخدام المفتاح النشط حالياً"""
        self.llm = ChatGroq(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            api_key=self.api_keys[self.current_key_index],
        )
        self.structured_llm = self.llm.with_structured_output(QueryAnalysis)

    def _rotate_key(self):
        """نقل الاعتماد للمفتاح التالي عند نفاذ الرصيد"""
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        logger.warning(f"🔄 Rotating API Key. Now using key index: {self.current_key_index}")
        self._initialize_llm_clients()


    # PDF / CSV / TEXT HELPERS

    def _try_decrypt_pdf(self, input_path: str) -> Tuple[str, Optional[str]]:
        try:
            import pikepdf
        except Exception:
            return input_path, None
        try:
            with pikepdf.open(input_path) as pdf:
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
                tmp.close()
                pdf.save(tmp.name)
                return tmp.name, tmp.name
        except Exception:
            return input_path, None

    def _ocr_pdf(self, pdf_path: str) -> List[Document]:
        if not OCR_ENABLED:
            return []
        try:
            from pdf2image import convert_from_path
            import pytesseract
            if TESSERACT_CMD:
                pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
            pages = convert_from_path(pdf_path)
            docs: List[Document] = []
            for idx, page_img in enumerate(pages, start=1):
                text = pytesseract.image_to_string(page_img, lang=PDF_OCR_LANG)
                text = normalize_text(text)
                if len(text) >= MIN_DOC_CHARS:
                    docs.append(
                        Document(
                            page_content=text,
                            metadata={"source": pdf_path, "type": "pdf_ocr", "page": idx},
                        )
                    )
            return docs
        except Exception as e:
            logger.warning("OCR failed for %s: %s", pdf_path, e)
            return []

    def _read_text_file(self, file_path: str) -> str:
        encodings = ["utf-8-sig", "utf-8", "cp1256", "latin-1"]
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc, errors="ignore") as f:
                    return f.read()
            except Exception:
                continue
        return ""

    def _load_pdf_documents(self, file_path: str) -> List[Document]:
        usable_path, temp_path = self._try_decrypt_pdf(file_path)
        try:
            try:
                docs = PyPDFLoader(usable_path).load()
            except Exception as e:
                logger.warning("PyPDFLoader failed for %s: %s", file_path, e)
                docs = []
            cleaned_docs: List[Document] = []
            total_chars = 0
            for d in docs:
                text = normalize_text(d.page_content or "")
                total_chars += len(text)
                if len(text) >= MIN_DOC_CHARS:
                    meta = dict(d.metadata or {})
                    meta["source"] = file_path
                    meta["type"] = "pdf_text"
                    cleaned_docs.append(Document(page_content=text, metadata=meta))
            if total_chars < 250 and OCR_ENABLED:
                ocr_docs = self._ocr_pdf(usable_path)
                if ocr_docs:
                    return ocr_docs
            return cleaned_docs
        finally:
            if temp_path and os.path.exists(temp_path) and temp_path != file_path:
                try: os.remove(temp_path)
                except Exception: pass

    def _load_text_documents(self, file_path: str, file_type: str) -> List[Document]:
        text = normalize_text(self._read_text_file(file_path))
        if len(text) < MIN_DOC_CHARS:
            return []
        return [Document(page_content=text, metadata={"source": file_path, "type": file_type})]

    def _load_csv_documents(self, file_path: str) -> List[Document]:
        docs: List[Document] = []
        try:
            raw = self._read_text_file(file_path)
            if not raw.strip(): return []
            sample = raw[:4096]
            try: dialect = csv.Sniffer().sniff(sample)
            except Exception: dialect = csv.excel
            from io import StringIO
            f = StringIO(raw)
            reader = csv.DictReader(f, dialect=dialect)
            if not reader.fieldnames: return []
            preferred_cols = ["question", "answer", "text", "content", "description", "title", "crop", "disease", "symptom", "cause", "treatment"]
            normalized_fields = {c.lower().strip(): c for c in reader.fieldnames}
            chosen_cols = [normalized_fields[c] for c in preferred_cols if c in normalized_fields]
            if not chosen_cols: chosen_cols = reader.fieldnames
            for row_idx, row in enumerate(reader, start=1):
                parts = []
                for col in chosen_cols:
                    value = row.get(col, "")
                    if value is None: continue
                    value = str(value).strip()
                    if not value: continue
                    parts.append(f"{col}: {value}")
                if not parts: continue
                row_text = normalize_text(" | ".join(parts))
                if len(row_text) < MIN_DOC_CHARS: continue
                if len(row_text) > CSV_MAX_ROW_CHARS: row_text = row_text[:CSV_MAX_ROW_CHARS]
                docs.append(Document(page_content=row_text, metadata={"source": file_path, "type": "csv", "row": row_idx}))
        except Exception as e:
            logger.warning("CSV loading failed for %s: %s", file_path, e)
        return docs

    def _load_documents(self, path: str) -> List[Document]:
        docs: List[Document] = []
        if not os.path.isdir(path):
            logger.warning("DATA_PATH does not exist: %s", path)
            return docs
        for root, _, files in os.walk(path):
            for filename in files:
                file_path = os.path.join(root, filename)
                ext = os.path.splitext(filename)[1].lower()
                try:
                    if ext == ".pdf": docs.extend(self._load_pdf_documents(file_path))
                    elif ext in [".txt", ".md"]: docs.extend(self._load_text_documents(file_path, ext[1:]))
                    elif ext == ".csv": docs.extend(self._load_csv_documents(file_path))
                except Exception as e:
                    logger.warning("Skipping file %s due to load error: %s", file_path, e)
        return docs


    # VECTOR DB

    def _load_or_build_vector_store(self):
        index_file = os.path.join(VECTOR_DB_PATH, "index.faiss")
        if os.path.exists(index_file):
            try:
                return FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
            except Exception as e:
                logger.exception("Failed to load existing FAISS index. Rebuilding if possible: %s", e)
        if not os.path.isdir(DATA_PATH) or not os.listdir(DATA_PATH):
            logger.warning("DATA_PATH is empty or missing. Vector store will not be created.")
            return None
        try:
            documents = self._load_documents(DATA_PATH)
            if not documents:
                logger.warning("No documents were loaded from DATA_PATH.")
                return None
            splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP, separators=["\n\n", "\n", ".", "،", ":", ";", " "])
            chunks = splitter.split_documents(documents)
            cleaned_chunks = []
            for ch in chunks:
                text = normalize_text(ch.page_content or "")
                if len(text) < MIN_DOC_CHARS: continue
                ch.page_content = text
                cleaned_chunks.append(ch)
            if not cleaned_chunks:
                logger.warning("Document splitting produced no valid chunks.")
                return None
            vector_store = FAISS.from_documents(cleaned_chunks, self.embeddings)
            os.makedirs(VECTOR_DB_PATH, exist_ok=True)
            vector_store.save_local(VECTOR_DB_PATH)
            print(f"[RAGEngine] Vector store built with {len(cleaned_chunks)} chunks.")
            return vector_store
        except Exception as e:
            logger.exception("Failed to build vector store: %s", e)
            return None


    # LANGUAGE DETECTION & HISTORY

    def _detect_language(self, text: str) -> str:
        text = text or ""
        ar = len(re.findall(r"[\u0600-\u06FF]", text))
        en = len(re.findall(r"[a-zA-Z]", text))
        if ar + en == 0: return "ar"
        return "ar" if ar >= en else "en"

    def _normalize_history_item(self, item: Dict[str, str]) -> Tuple[str, str]:
        if not isinstance(item, dict): return "user", ""
        role = str(item.get("role") or item.get("sender") or "user").strip().lower()
        content = str(item.get("content") or item.get("text") or "").strip()
        content = normalize_text(content)
        if role in ("human", "user", "customer", "sender"): role = "user"
        elif role in ("assistant", "ai", "bot", "chatbot"): role = "assistant"
        else: role = "user"
        return role, content

    def _format_history_text(self, history: List[Dict[str, str]]) -> str:
        if not history: return "(no history)"
        lines = []
        for item in history[-MAX_HISTORY_TURNS:]:
            role, content = self._normalize_history_item(item)
            if content: lines.append(f"{role.upper()}: {content}")
        return "\n".join(lines) if lines else "(no history)"

    def _build_history_messages(self, history: List[Dict[str, str]]):
        msgs = []
        for item in (history[-MAX_HISTORY_TURNS:] if history else []):
            role, content = self._normalize_history_item(item)
            if not content: continue
            if role == "user": msgs.append(HumanMessage(content=content))
            else: msgs.append(AIMessage(content=content))
        return msgs


    # ANALYSIS & RETRIEVAL

    def _analyze_query(self, message: str, history: List[Dict[str, str]]):
        try:
            message = normalize_text(message)
            chain = ANALYSIS_PROMPT | self.structured_llm
            return chain.invoke({"history": self._format_history_text(history), "question": message})
        except Exception as e:
            if "429" in str(e) or "401" in str(e) or "rate_limit" in str(e).lower():
                raise e
            logger.warning("Query analysis failed, using safe fallback: %s", e)
            return QueryAnalysis(domain="agricultural", intent="general", question_type="general", rewritten_query=message)

    def _retrieve_and_rerank(self, query: str):
        if not self.retriever: return [], []
        try: docs = self.retriever.invoke(query)
        except Exception as e:
            logger.warning("Retriever failed, returning empty results: %s", e)
            return [], []
        if not docs: return [], []

        unique_docs = []
        seen = set()
        for d in docs:
            text = normalize_text(d.page_content or "")
            if not text or text in seen: continue
            seen.add(text)
            d.page_content = text
            unique_docs.append(d)
        docs = unique_docs

        if self.reranker and len(docs) > 1:
            try:
                pairs = [(query, d.page_content) for d in docs]
                scores = self.reranker.predict(pairs)
                scores = [1 / (1 + math.exp(-float(s))) for s in scores]
                ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
                ranked = ranked[:RETRIEVER_K]
                if not ranked: return [], []
                docs, scores = zip(*ranked)
                return list(docs), list(scores)
            except Exception as e:
                logger.warning("Reranking failed, using fallback scores: %s", e)

        fallback_scores = [max(0.55, 0.85 - (0.03 * i)) for i in range(min(len(docs), RETRIEVER_K))]
        return docs[:RETRIEVER_K], fallback_scores

    def _compute_confidence(self, scores: List[float], has_context: bool):
        if not has_context: return 0.45, "NO_CONTEXT"
        if not scores: return 0.55, "NO_SCORES"
        avg = sum(scores) / len(scores)
        best = max(scores)
        worst = min(scores)
        retrieval_confidence = (avg * 0.7) + (best * 0.3)
        spread = best - worst
        if spread > 0.30: retrieval_confidence -= 0.03
        retrieval_confidence = max(0.0, min(1.0, round(retrieval_confidence, 2)))

        if retrieval_confidence >= 0.75: status = "STRONG"
        elif retrieval_confidence >= 0.58: status = "MEDIUM"
        elif retrieval_confidence >= 0.40: status = "WEAK"
        else: status = "VERY_WEAK"
        return retrieval_confidence, status

    def _blend_confidence(self, retrieval_confidence: float, retrieval_status: str, llm_confidence: float, has_context: bool, intent: str) -> float:
        weights = {"STRONG": 0.70, "MEDIUM": 0.58, "WEAK": 0.42, "VERY_WEAK": 0.30, "NO_SCORES": 0.35, "NO_CONTEXT": 0.25}
        retrieval_weight = weights.get(retrieval_status, 0.50)
        if not has_context: retrieval_weight = min(retrieval_weight, 0.25)
        if intent == "general": llm_confidence = max(llm_confidence, 0.55)
        if has_context and retrieval_status == "STRONG": retrieval_weight = min(0.75, retrieval_weight + 0.05)
        llm_weight = 1.0 - retrieval_weight
        final_confidence = (retrieval_confidence * retrieval_weight) + (llm_confidence * llm_weight)
        return round(max(0.0, min(1.0, final_confidence)), 2)

    # SMART FOLLOW-UP 
    
    def _get_unique_follow_up(self, session_id: str, intent: str, question_type: str, lang: str) -> Optional[str]:
        used = self.session_follow_ups.setdefault(session_id, set())
        arabic_options = {
            "irrigation": [
                "تحب نخطط سوا جدول ري مثالي يروي زرعك صح؟ 💧",
                "إيه رأيك نعرف كمية المية المظبوطة اللي محتاجها فدانك؟ 🌊",
                "تحب نحدد مواعيد الري عشان نحمي الجذور من أي أعفان؟ 🛡️",
                "حابب تعرف إزاي توفر في المية وتحافظ على جودة المحصول؟ 🌿",
                "تحب نكشف عن علامات عطش النبات قبل ما تزيد؟ 🍂",
            ],
            "fertilizer": [
                "تحب نعرف الزرع محتاج غذا إيه بالظبط ومواعيده؟ 🌾",
                "إيه رأيك نحدد قائمة الأسمدة اللي تخلي محصولك ملوش مثيل؟ 🧪",
                "حابب تعرف الطريقة الصح لإضافة السماد عشان ميتدرش؟ 📈",
                "تحب نكشف عن نقص العناصر من شكل الورقة سوا؟ 🍃",
                "تحب نخطط برنامج تسميد يرمي معاك إنتاج عالي؟ 💰",
            ],
            "disease_pest": [
                "تحب نحدد خطة علاج تحمي زرعك وتوقف الإصابة فوراً؟ 🛡️",
                "إيه رأيك نعرف أنسب وأأمن مبيد يقضي على المشكلة دي؟ 💊",
                "تحب نعرف إزاي نحمي المحصول من العدوى المرة الجاية؟ 🦟",
                "حابب تعرف بدائل طبيعية للمبيدات تحافظ على زرعك؟ 🌿",
                "تحب نحدد فترة الأمان عشان تجمع محصول سليم تماماً؟ ⏳",
            ],
            "soil": [
                "تحب نعرف إزاي نخلي أرضك خصبة ونعالج الملوحة نهائياً؟ 🌱",
                "إيه رأيك نحدد المحاصيل اللي تمشي 'طلقة' في نوع تربتك؟ 🔄",
                "تحب نعرف إزاي ناخد عينة تربة صح ونحللها؟ 🧪",
                "حابب تعرف إزاي تجهز الأرض وتخليها 'زي الحرير' للزراعة؟ 🚜",
                "إيه رأيك نحدد كمية الجبس الزراعي المطلوبة لأرضك؟ ✨",
            ],
            "crop_advice": [
                "تحب أرسم لك خريطة طريق لزرعك من البذرة للحصاد؟ 📅",
                "إيه رأيك نعرف أنسب ميعاد زراعة يخلي إنتاجك ملوش زي؟ 🗺️",
                "تحب نختار سوا أفضل أصناف التقاوي اللي بتنجح في منطقتك؟ 💎",
                "حابب تعرف أسرار زيادة حجم الثمار عشان التصدير؟ 🚢",
                "تحب نعرف المسافات الصح بين الشتلات عشان الزرع يتنفس؟ 📏",
            ],
            "general": [
                "تحب أقولك على شوية أسرار تزود إنتاجية فدانك؟ ✨",
                "إيه رأيك نراجع سوا جدول العمليات الزراعية للأسبوع ده؟ 📒",
                "حابب تعرف أحدث تكنولوجيا بتستخدم في زراعة محصولك؟ 🚀",
                "تحب نحدد أهم التحديات اللي ممكن تقابلك الموسم ده؟ ⚠️",
                "تحب ندردش في أي مشكلة تانية شاغلة بالك في الأرض؟ 🤝",
            ],
        }
        english_options = {
            "irrigation": [
                "Shall we plan a perfect irrigation schedule for your crops? 💧",
                "How about finding the exact water amount your field needs? 🌊",
                "Want to set watering times to protect roots from rot? 🛡️",
                "Interested in saving water while keeping top quality? 🌿",
                "Should we look for early signs of crop thirst? 🍂",
            ],
            "fertilizer": [
                "Want to know exactly what nutrients your crops need and when? 🌾",
                "How about a fertilizer list to make your yield unmatched? 🧪",
                "Interested in the best way to apply fertilizer without waste? 📈",
                "Should we check leaf patterns for nutrient deficiencies together? 🍃",
                "Ready to plan a fertilization program for high production? 💰",
            ],
            "disease_pest": [
                "Shall we set a treatment plan to stop the infection now? 🛡️",
                "How about finding the safest pesticide to solve this? 💊",
                "Want to learn how to protect your yield from next time? 🦟",
                "Interested in natural pesticide alternatives? 🌿",
                "Shall we define the safety period before harvest? ⏳",
            ],
            "soil": [
                "Want to learn how to make your soil fertile and fix salinity? 🌱",
                "How about finding the best crops for your soil type? 🔄",
                "Shall we learn how to take and analyze a soil sample? 🧪",
                "Interested in preparing your land perfectly for planting? 🚜",
                "Want to define the amount of agricultural gypsum needed? ✨",
            ],
            "crop_advice": [
                "Shall we map out your crop's journey from seed to harvest? 📅",
                "How about finding the best planting dates for top yield? 🗺️",
                "Want to pick the best seed varieties for your region? 💎",
                "Interested in secrets to increase fruit size for export? 🚢",
                "Shall we define the ideal spacing between plants? 📏",
            ],
            "general": [
                "Want some secrets to increase your field's productivity? ✨",
                "How about reviewing this week's agricultural tasks together? 📒",
                "Interested in the latest tech for your specific crop? 🚀",
                "Shall we identify the main challenges this season? ⚠️",
                "Care to chat about any other issues on your mind? 🤝",
            ],
        }

        pool = (arabic_options if lang == "ar" else english_options).get(
            intent,
            (arabic_options if lang == "ar" else english_options)["general"]
        )

        available = [q for q in pool if q not in used]
        
    
        if not available:
            general_pool = (arabic_options if lang == "ar" else english_options)["general"]
            general_available = [q for q in general_pool if q not in used]
        
            if not general_available:
                return None
                
            available = general_available

        chosen = random.choice(available)
        used.add(chosen)
        return chosen

    def _follow_up_fallback(self, intent: str, question_type: str, lang: str, session_id: str = "default") -> Optional[str]:
        return self._get_unique_follow_up(session_id, intent, question_type, lang)

    def _ensure_suggestion_style(self, text: str, lang: str, session_id: str) -> Optional[str]:
        if not text: return text
        text = normalize_text(str(text).strip())
        banned_starts = ["create", "make", "generate", "build", "set", "design", "انشئ", "اعمل", "صمم", "جهز"]
        first_word = text.split()[0].lower() if text.split() else ""

        if first_word in banned_starts or len(text.split()) < 4:
            return self._get_unique_follow_up(session_id, "general", "general", lang)
        return text

    def _generate_follow_up(self, intent: str, question_type: str, question: str, answer: str, lang: str, session_id: str = "default") -> Optional[str]:
        try:
            if intent == "general" or not answer or len(answer.split()) < 10:
                return self._get_unique_follow_up(session_id, intent, question_type, lang)

    
            used = self.session_follow_ups.setdefault(session_id, set())
            previous_qs_str = " | ".join(used) if used else "None"

            chain = FOLLOWUP_PROMPT | self.llm | StrOutputParser()
            result = chain.invoke({
                "lang": lang, 
                "intent": intent, 
                "question_type": question_type, 
                "question": question, 
                "answer": answer,
                "previous_questions": previous_qs_str  
            })

            if not result:
                return self._get_unique_follow_up(session_id, intent, question_type, lang)

            result = normalize_text(str(result).strip())
            if "?" not in result:
                return self._get_unique_follow_up(session_id, intent, question_type, lang)

            if len(result.split()) > 18:
                result = " ".join(result.split()[:18])

            if result in used:
                return self._get_unique_follow_up(session_id, intent, question_type, lang)

            used.add(result)
            return self._ensure_suggestion_style(result, lang, session_id)

        except Exception as e:
            if "429" in str(e) or "401" in str(e) or "rate_limit" in str(e).lower():
                raise e
            logger.warning("Follow-up generation failed: %s", e)
            return self._get_unique_follow_up(session_id, intent, question_type, lang)


        # MAIN ASK
    def ask(self, message, history, session_id):
        history = history or []
        message = normalize_text(message)
        lang = self._detect_language(message)
        session_id = session_id or "default"
    
        negative_responses = [
            "لا", "لأ", "لا شكرا", "شكرا", "مش عايز", "مش دلوقتي",
            "no", "nope", "not now"
        ]
    
        message_clean = message.strip().lower()
    
        if any(word == message_clean for word in negative_responses):
            return {
                "answer": (
                    "تمام 🌱 لو احتجت أي مساعدة زراعية أنا موجود."
                    if lang == "ar"
                    else "Okay 🌱 I'm here if you need any agricultural help."
                ),
                "intent": "general",
                "question_type": "general",
                "language": lang,
                "confidence": 1.0,
                "retrieval_confidence": 1.0,
                "retrieval_status": "USER_DECLINED",
                "route": "agricultural",
                "sources": [],
                "follow_up_question": None
            }
    
        if _is_out_of_domain_fast(message):
            return self._build_error_response("out_of_domain", lang, "OUT_OF_DOMAIN")
    
        for attempt in range(len(self.api_keys)):
            try:
                analysis = self._analyze_query(message, history)
    
                if analysis.domain == "out_of_domain":
                    return self._build_error_response("out_of_domain", lang, "OUT_OF_DOMAIN")
    
                docs, scores = self._retrieve_and_rerank(analysis.rewritten_query)
                context_status = bool(docs)
    
                retrieval_confidence, retrieval_status = self._compute_confidence(scores, context_status)
    
                if not docs:
                    answer = (
                        "المعلومة غير متوفرة بدقة في البيانات الحالية. لو تكتبي اسم المحصول أو المشكلة بشكل أوضح، أقدر أساعدك أفضل."
                        if lang == "ar"
                        else "The information is not available with enough accuracy. Please clarify."
                    )
    
                    follow_up = self._follow_up_fallback(
                        analysis.intent,
                        analysis.question_type,
                        lang,
                        session_id
                    )
    
                    return self._build_success_response(
                        answer,
                        analysis,
                        lang,
                        0.35,
                        retrieval_confidence,
                        retrieval_status,
                        docs,
                        follow_up
                    )
    
                llm_conf = 0.78 if analysis.intent != "general" else 0.58
    
                confidence = self._blend_confidence(
                    retrieval_confidence,
                    retrieval_status,
                    llm_conf,
                    context_status,
                    analysis.intent
                )
    
                chain = MAIN_PROMPT | self.llm | StrOutputParser()
    
                answer = chain.invoke({
                    "context": "\n\n".join(d.page_content for d in docs) if docs else "",
                    "question": analysis.rewritten_query,
                    "history": self._build_history_messages(history),
                    "lang": lang,
                    "context_status": retrieval_status
                })
    
                follow_up = self._generate_follow_up(
                    analysis.intent,
                    analysis.question_type,
                    analysis.rewritten_query,
                    answer,
                    lang,
                    session_id
                )
    
                return self._build_success_response(
                    answer,
                    analysis,
                    lang,
                    confidence,
                    retrieval_confidence,
                    retrieval_status,
                    docs,
                    follow_up
                )
    
            except Exception as api_error:
                err_msg = str(api_error).lower()
    
                if "429" in err_msg or "rate_limit" in err_msg or "401" in err_msg:
                    logger.warning("API Key exhausted during ask(). Rotating...")
                    self._rotate_key()
                    continue
                else:
                    logger.exception("Unexpected error inside ask()")
                    break
    
        return {
            "answer": "عذراً، النظام يواجه ضغطاً كبيراً حالياً، يرجى المحاولة لاحقاً."
            if lang == "ar"
            else "System under heavy load, please try again later.",
            "intent": "general",
            "question_type": "general",
            "language": lang,
            "confidence": 0.0,
            "retrieval_confidence": 0.0,
            "retrieval_status": "ALL_KEYS_EXHAUSTED",
            "route": "agricultural",
            "sources": [],
            "follow_up_question": None
        }

    
    # TITLE 

    def generate_title(self, messages):
        sample = "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')}"
            for m in messages[:4]
        )
        
        for _ in range(len(self.api_keys)):
            try:
                chain = TITLE_PROMPT | self.llm | StrOutputParser()
                return chain.invoke({"conversation": sample}).strip()
            
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "rate_limit" in err_msg or "401" in err_msg:
                    logger.warning("API Key exhausted during generate_title(). Rotating...")
                    self._rotate_key()
                    continue
                else:
                    logger.warning("Title generation failed, using fallback: %s", e)
                    break
                    
        return "محادثة زراعية"


    # HELPER 

    def _build_error_response(self, domain, lang, status):
        return {
            "answer": "", "intent": domain, "question_type": "general", "language": lang,
            "confidence": 1.0 if domain == "out_of_domain" else 0.0, "retrieval_confidence": 0.0,
            "retrieval_status": status, "route": domain, "sources": [], "follow_up_question": None
        }

    def _build_success_response(self, answer, analysis, lang, conf, ret_conf, ret_status, docs, follow_up):
        return {
            "answer": answer, "intent": analysis.intent, "question_type": analysis.question_type,
            "language": lang, "confidence": conf, "retrieval_confidence": ret_conf,
            "retrieval_status": ret_status, "route": analysis.domain,
            "sources": [d.metadata.get("source", "") for d in docs] if docs else [],
            "follow_up_question": follow_up
        }