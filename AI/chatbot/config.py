
import os
from dotenv import load_dotenv

load_dotenv()

# PATHS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "chat_data")
VECTOR_DB_PATH = os.path.join(BASE_DIR, "vectorstore")
CLEAN_PATH = os.path.join(BASE_DIR, "data", "clean_text")

os.makedirs(DATA_PATH, exist_ok=True)
os.makedirs(VECTOR_DB_PATH, exist_ok=True)
os.makedirs(CLEAN_PATH, exist_ok=True)

# API

GROQ_API_KEYS = []
for i in range(1, 9):
    key = os.environ.get(f"GROQ_API_KEY_{i}")
    if key:
        GROQ_API_KEYS.append(key.strip())
        
if not GROQ_API_KEYS:
    primary_key = os.environ.get("GROQ_API_KEY")
    if primary_key:
        GROQ_API_KEYS.append(primary_key.strip())
                
if not GROQ_API_KEYS:
    print("⚠️ Warning: No API keys found in Environment Variables!")
    
# LLM SETTINGS

LLM_MODEL = "llama-3.3-70b-versatile"
LLM_TEMPERATURE = 0.3
LLM_MAX_TOKENS = 512


# CONTEXT SETTINGS

MAX_HISTORY_TURNS = 6


# EMBEDDINGS

EMBEDDING_MODEL = "intfloat/multilingual-e5-base"


# RERANKER

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-2-v2"
USE_GPU = False
RERANK_MIN_SCORE = 0.35


# CHUNKING

CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


# RETRIEVAL PIPELINE

RETRIEVER_FETCH_K = 20
RERANK_TOP_N = 8
RETRIEVER_K = 5

# DATA HANDLING

MIN_DOC_CHARS = 40
CSV_MAX_ROW_CHARS = 1800
OCR_ENABLED = True
PDF_OCR_LANG = "ara+eng"
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", "").strip()

# SERVER

SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000


# OPTIONAL

SESSION_CACHE_SIZE = 200
STRICT_GROUNDING = True
CACHE_TTL_SECONDS = 300