import os
import re
import csv
import unicodedata
import tempfile
from typing import List

# PDF handling
try:
    import pikepdf
except Exception:
    pikepdf = None


from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document


# CONFIG

DATA_PATH = "data/chat_data"
CLEAN_PATH = "data/clean_text"
VECTOR_DB_PATH = "vectorstore"

EMBEDDING_MODEL = "intfloat/multilingual-e5-base"

CHUNK_SIZE = 700
CHUNK_OVERLAP = 120

MIN_DOC_CHARS = 40
CSV_MAX_ROW_CHARS = 1800

os.makedirs(CLEAN_PATH, exist_ok=True)
os.makedirs(VECTOR_DB_PATH, exist_ok=True)

embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)



# TEXT CLEANING

def clean_text(text):
    if not text:
        return ""

    text = str(text)
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)  # remove Arabic diacritics
    text = text.replace("\u0640", "")  # التشكيل 

    text = re.sub(r"\n+", "\n", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()

    return text



# DECRYPT PDF

def decrypt_pdf(input_path, output_path):
    if pikepdf is None:
        return input_path

    try:
        with pikepdf.open(input_path) as pdf:
            pdf.save(output_path)
        print(f" Decrypted: {input_path}")
        return output_path
    except Exception:
        print(f" Could not decrypt: {input_path}")
        return input_path



# NORMAL PDF

def extract_text_normal(pdf_path):
    try:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        return "\n".join([d.page_content for d in docs])
    except Exception as e:
        print(f" PDF load failed for {pdf_path}: {e}")
        return ""


# OCR PDF 

def extract_text_ocr(pdf_path):
    try:
        from pdf2image import convert_from_path
        import pytesseract
        
        print(f" OCR Processing: {pdf_path}")
        images = convert_from_path(pdf_path)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img, lang="ara+eng") + "\n"
        return text
    except Exception as e:
        print(f" OCR failed for {pdf_path}. Skipping OCR. Reason: {e}")
        return ""


# CSV EXTRACTION

def extract_csv_documents(csv_path: str) -> List[Document]:
    docs: List[Document] = []

    try:
        raw = ""
        for enc in ["utf-8-sig", "utf-8", "cp1256", "latin-1"]:
            try:
                with open(csv_path, "r", encoding=enc, errors="ignore") as f:
                    raw = f.read()
                if raw.strip():
                    break
            except Exception:
                continue

        if not raw.strip():
            return docs

        sample = raw[:4096]
        try:
            dialect = csv.Sniffer().sniff(sample)
        except Exception:
            dialect = csv.excel

        from io import StringIO
        f = StringIO(raw)
        reader = csv.DictReader(f, dialect=dialect)

        if not reader.fieldnames:
            return docs

        preferred_cols = [
            "question", "answer", "text", "content", "description",
            "title", "crop", "disease", "symptom", "cause", "treatment"
        ]

        normalized_fields = {c.lower().strip(): c for c in reader.fieldnames}
        chosen_cols = [normalized_fields[c] for c in preferred_cols if c in normalized_fields]

        if not chosen_cols:
            chosen_cols = reader.fieldnames

        for row_idx, row in enumerate(reader, start=1):
            parts = []
            for col in chosen_cols:
                value = row.get(col, "")
                if value is None:
                    continue

                value = str(value).strip()
                if not value:
                    continue

                parts.append(f"{col}: {value}")

            if not parts:
                continue

            row_text = clean_text(" | ".join(parts))

            if len(row_text) < MIN_DOC_CHARS:
                continue

            if len(row_text) > CSV_MAX_ROW_CHARS:
                row_text = row_text[:CSV_MAX_ROW_CHARS]

            docs.append(
                Document(
                    page_content=row_text,
                    metadata={
                        "source": csv_path,
                        "type": "csv",
                        "row": row_idx
                    }
                )
            )

    except Exception as e:
        print(f" CSV load failed for {csv_path}: {e}")

    return docs



# MAIN PROCESS

def process_data():
    all_documents: List[Document] = []

    if not os.path.isdir(DATA_PATH):
        print(f"DATA_PATH not found: {DATA_PATH}")
        return all_documents

    for file in os.listdir(DATA_PATH):
        full_path = os.path.join(DATA_PATH, file)

        # PDF files
        if file.lower().endswith(".pdf"):
            unlocked_path = os.path.join(DATA_PATH, f"unlocked_{file}")

            pdf_path = decrypt_pdf(full_path, unlocked_path)
            text = extract_text_normal(pdf_path)
            text = clean_text(text)
            if len(text) < 200:
                print(f" Weak text -> switching to OCR: {file}")
                ocr_text = extract_text_ocr(pdf_path)
                text = clean_text(ocr_text)

            if len(text) < 200:
                print(f" Skipped (too small/unreadable): {file}")
                continue


            txt_file = os.path.join(CLEAN_PATH, file.replace(".pdf", ".txt"))
            with open(txt_file, "w", encoding="utf-8") as f:
                f.write(text)

            all_documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "source": full_path,
                        "type": "pdf"
                    }
                )
            )

        # CSV files
        elif file.lower().endswith(".csv"):
            csv_docs = extract_csv_documents(full_path)
            if csv_docs:
                print(f" Successfully loaded CSV: {file} ({len(csv_docs)} valid rows extracted)")
                all_documents.extend(csv_docs)
            else:
                print(f" Skipped CSV (empty or unreadable): {file}")

    return all_documents



# CHUNKING + VECTOR DB 
def build_vector_db(documents: List[Document]):
    print(" Building vector database...")

    if not documents:
        print(" No documents found. Vector DB not created.")
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", "،", ":", ";", " "]
    )

    chunks = splitter.split_documents(documents)

    cleaned_chunks = []
    for ch in chunks:
        text = clean_text(ch.page_content)
        if len(text) < MIN_DOC_CHARS:
            continue
        ch.page_content = text
        cleaned_chunks.append(ch)

    total_chunks = len(cleaned_chunks)
    print(f" Total chunks: {total_chunks}")

    batch_size = 5000
    vector_store = None
    
    total_batches = (total_chunks // batch_size) + (1 if total_chunks % batch_size != 0 else 0)

    for i in range(0, total_chunks, batch_size):
        batch = cleaned_chunks[i : i + batch_size]
        current_batch = (i // batch_size) + 1
        print(f" Processing batch {current_batch} / {total_batches}...")
        
        if vector_store is None:
            vector_store = FAISS.from_documents(batch, embeddings)
        else:
            vector_store.add_documents(batch)
            
        vector_store.save_local(VECTOR_DB_PATH)

    print(" Vector DB Ready and saved successfully!")


# RUN

if __name__ == "__main__":
    docs = process_data()
    build_vector_db(docs)