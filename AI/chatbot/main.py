from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
import hashlib
import json
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag_engine import RAGEngine
from config import SERVER_HOST, SERVER_PORT, CACHE_TTL_SECONDS

# ENGINE
engine: Optional[RAGEngine] = None

# CACHE
CACHE: Dict[str, Dict[str, Any]] = {}

def _normalize_text_for_cache(text: str) -> str:
    return (text or "").strip().lower()

def _make_cache_key(session_id, user_id, message, history):
    payload = {
        "session_id": session_id or "",
        "user_id": user_id or "",
        "message": _normalize_text_for_cache(message),
        "history": history or []
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def _get_from_cache(key: str):
    item = CACHE.get(key)
    if not item:
        return None
    if time.time() - item["time"] > CACHE_TTL_SECONDS:
        CACHE.pop(key, None)
        return None
    return item["value"]

def _save_to_cache(key: str, value: Dict[str, Any]):
    CACHE[key] = {"time": time.time(), "value": value}

# HELPER
def _build_out_of_domain_reply(lang: str) -> str:
    if lang == "ar":
        return (
            "أنا GreenMindBot 🌱 مساعدك الزراعي الذكي.\n\n"
            "السؤال ده خارج مجال الزراعة 😊\n\n"
            "ممكن تسألني عن:\n"
            "- المحاصيل \n"
            "- أمراض النباتات \n"
            "- الري والتسميد \n"
            "- التربة والزراعة "
        )
    return (
        "I am GreenMindBot 🌱, your agricultural assistant in Egypt.\n"
        "This question is outside the scope of agriculture 😊\n"
        "If you have any questions about crops, soil, or irrigation, I'm here to help."
    )

# FASTAPI LIFESPAN
@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    print("Starting GreenMind AI Service...")
    
    # ✅ تشغيل المحرك مباشرة لتهيئة كل شيء قبل بدء السيرفر
    engine = RAGEngine()       
    print("Engine ready and fully loaded!")
    yield
    print("Shutting down...")

app = FastAPI(
    title="GreenMind AI Service",
    version="4.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# MODELS
class ChatHistoryMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    message: str
    history: List[ChatHistoryMessage] = []
    metadata: Dict[str, Any] = {}

class AnalysisData(BaseModel):
    type: str
    confidence: float
    result: str

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    status: str = "success"
    analysis: AnalysisData
    follow_up_question: Optional[str] = None

class TitleRequest(BaseModel):
    messages: List[Dict[str, str]] = Field(
        ...,
        example=[{"role": "user", "content": "كيف أعالج صدأ القمح؟"}]
    )

# ✅ موديل جديد عشان الباك إند يشوف شكل استجابة العنوان بوضوح في الـ Docs
class TitleResponse(BaseModel):
    title: str

# HELPERS
def detect_language(text: str) -> str:
    ar = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
    en = sum(1 for c in text if c.isalpha() and "a" <= c.lower() <= "z")
    return "ar" if ar >= en else "en"

def resolve_language(req: ChatRequest) -> str:
    meta = req.metadata.get("language") if isinstance(req.metadata, dict) else None
    if meta in ["ar", "en"]:
        return meta
    return detect_language(req.message)

# MAIN ENDPOINT
@app.post("/chat/send", response_model=ChatResponse)
def chat_send(req: ChatRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        history_dicts = [
            {
                "role": "user" if m.sender == "user" else "assistant",
                "content": m.text
            }
            for m in req.history
        ]

        session_id = req.session_id or "temp_session"
        user_id = req.user_id or "anonymous"
        lang = resolve_language(req)

        cache_key = _make_cache_key(
            session_id,
            user_id,
            req.message,
            history_dicts
        )

        cached = _get_from_cache(cache_key)
        if cached:
            return ChatResponse(
                session_id=session_id,
                reply=cached["answer"],
                analysis=AnalysisData(
                    type=cached["intent"],
                    confidence=cached["confidence"],
                    result=cached["route"]
                ),
                follow_up_question=cached.get("follow_up_question"),
                status="success"
            )

        # CALL ENGINE
        result = engine.ask(
            message=req.message,
            history=history_dicts,
            session_id=session_id
        )

        # SAFE FIX: check for out_of_domain
        if isinstance(result, dict) and result.get("route") == "out_of_domain":
            refusal_reply = _build_out_of_domain_reply(lang)
            result = {
                **result,
                "answer": refusal_reply,
                "follow_up_question": None,
                "intent": "out_of_domain", # ✅ التعديل هنا: هيرجع out_of_domain بدل general
                "confidence": float(result.get("confidence", 1.0)),
                "route": "out_of_domain"
            }

        response = {
            "session_id": session_id,
            "reply": result["answer"],
            "analysis": {
                "type": result["intent"],
                "confidence": result["confidence"],
                "result": result["route"]
            },
            "follow_up_question": result.get("follow_up_question"),
            "status": "success"
        }

        _save_to_cache(cache_key, result)

        return response

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# TITLE ENDPOINT
@app.post("/generate-title", response_model=TitleResponse) # ✅ ربطنا الموديل هنا
def generate_title(req: TitleRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        title = engine.generate_title(req.messages)
        return {"title": title} # ✅ بيرجع title مش reply
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# RUN
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=SERVER_HOST, port=SERVER_PORT, reload=True)