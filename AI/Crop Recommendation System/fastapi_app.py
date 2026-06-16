from __future__ import annotations
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from joblib import load
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Egypt Crop Recommendation API",
    version="1.0.0",
    description="Crop recommendation system for Egypt with regional validation and water requirements."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "./outputs/egypt_crop_model.joblib"
LABEL_ENCODER_PATH = "./outputs/label_encoder.joblib"

model = None
label_encoder = None

WATER_REQUIREMENTS = {
    "wheat": "1800 - 2400 m3/feddan (Medium water need)",
    "barley": "1200 - 1800 m3/feddan (Low water need / Drought tolerant)",
    "rice": "7000 - 9000 m3/feddan (High water need)",
    "maize": "2800 - 3800 m3/feddan (Medium water need)",
    "cotton": "3200 - 4200 m3/feddan (Medium water need)",
    "sugar_beet": "2500 - 3500 m3/feddan (Medium water need)",
    "faba_bean": "1400 - 1800 m3/feddan (Low water need)",
    "lentil": "1200 - 1700 m3/feddan (Low water need)",
    "berseem": "3500 - 5000 m3/feddan (High water need)",
    "tomato_winter": "2500 - 3500 m3/feddan (Medium water need)",
    "tomato_summer": "3500 - 5000 m3/feddan (High water need)",
    "potato": "2500 - 3200 m3/feddan (Medium water need)",
    "onion": "1800 - 2400 m3/feddan (Low water need)",
    "garlic": "1800 - 2400 m3/feddan (Low water need)",
    "eggplant": "3000 - 4000 m3/feddan (Medium water need)",
    "pepper": "2800 - 3800 m3/feddan (Medium water need)",
    "cabbage": "2500 - 3200 m3/feddan (Medium water need)",
    "cucumber": "2000 - 3000 m3/feddan (Medium water need)",
    "watermelon": "2000 - 3000 m3/feddan (Medium water need)",
    "citrus": "5000 - 6500 m3/feddan (High water need)",
    "mango": "4000 - 6000 m3/feddan (Medium water need)",
    "banana": "9000 - 12000 m3/feddan (Very high water need)",
    "grapes": "3000 - 4500 m3/feddan (Medium water need)",
    "date_palm": "6000 - 8000 m3/feddan (High water need)",
    "olive": "1500 - 2500 m3/feddan (Low water need / Drought tolerant)",
    "pomegranate": "3000 - 4000 m3/feddan (Medium water need)",
    "mint": "2000 - 3000 m3/feddan (Medium water need)",
    "basil": "2000 - 3000 m3/feddan (Medium water need)",
    "coriander": "1200 - 1800 m3/feddan (Low water need)",
    "cumin": "1000 - 1500 m3/feddan (Low water need)",
}

class CropInfo(BaseModel):
    crop_name: str
    water_needs: str

class PredictResponse(BaseModel):
    message: str
    top_3_crops: list[CropInfo]

class PredictRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    month: int
    soil_type: str
    governorate: str

@app.on_event("startup")
def load_artifacts():
    global model, label_encoder
    model = load(MODEL_PATH)
    label_encoder = load(LABEL_ENCODER_PATH)

GOV_TO_REGION = {
    "cairo": "middle_egypt", "القاهرة": "middle_egypt",
    "giza": "middle_egypt", "الجيزة": "middle_egypt",
    "fayoum": "middle_egypt", "faiyum": "middle_egypt", "الفيوم": "middle_egypt",
    "beni suef": "middle_egypt", "بني سويف": "middle_egypt",
    "minya": "middle_egypt", "المنيا": "middle_egypt",
    "alexandria": "north_coast", "الإسكندرية": "north_coast",
    "matrouh": "north_coast", "matruh": "north_coast", "مطروح": "north_coast",
    "beheira": "west_delta", "البحيرة": "west_delta",
    "kafr el sheikh": "north_delta", "kafr el-sheikh": "north_delta", "كفر الشيخ": "north_delta",
    "dakahlia": "north_delta", "الدقهلية": "north_delta",
    "damietta": "north_delta", "دمياط": "north_delta",
    "gharbia": "south_delta", "الغربية": "south_delta",
    "menoufia": "south_delta", "monufia": "south_delta", "المنوفية": "south_delta",
    "qalyubia": "south_delta", "القليوبية": "south_delta",
    "sharqia": "east_delta", "الشرقية": "east_delta",
    "ismailia": "east_delta", "الإسماعيلية": "east_delta",
    "suez": "east_delta", "السويس": "east_delta",
    "port said": "east_delta", "بورسعيد": "east_delta",
    "assiut": "upper_egypt", "asyut": "upper_egypt", "أسيوط": "upper_egypt",
    "sohag": "upper_egypt", "سوهاج": "upper_egypt",
    "qena": "upper_egypt", "قنا": "upper_egypt",
    "luxor": "upper_egypt", "الأقصر": "upper_egypt",
    "aswan": "upper_egypt", "أسوان": "upper_egypt",
    "red sea": "upper_egypt", "البحر الأحمر": "upper_egypt",
    "north sinai": "sinai_north", "شمال سيناء": "sinai_north",
    "south sinai": "sinai_north", "جنوب سيناء": "sinai_north",
    "new valley": "new_lands", "الوادي الجديد": "new_lands",
}

def get_season(month: int) -> str:
    if month in [11, 12, 1, 2, 3, 4]:
        return "winter"
    elif month in [5, 6]:
        return "summer"
    else:  
        return "permanent"
def validate_logic(payload: PredictRequest, region: str):
    SOIL_PH = {
        "clayey_delta": (7.8, 8.5), "loamy_clay": (7.6, 8.1), "alluvial": (7.5, 8.2),
        "sandy": (7.2, 7.9), "calcareous": (7.6, 8.3), "reclaimed": (7.4, 8.4),
    }
    REGIONS = {
        "north_delta": {"humidity": (55, 80), "temp": {1:(10,18),2:(10,19),3:(11,22),4:(14,26),5:(17,30),6:(20,32),7:(22,33),8:(22,33),9:(21,32),10:(18,29),11:(14,24),12:(10,20)}},
        "south_delta": {"humidity": (45, 65), "temp": {1:(10,19),2:(10,21),3:(12,24),4:(15,28),5:(18,32),6:(21,34),7:(23,35),8:(23,35),9:(22,33),10:(19,30),11:(15,25),12:(11,21)}},
        "east_delta": {"humidity": (50, 70), "temp": {1:(10,19),2:(10,20),3:(11,23),4:(14,27),5:(17,31),6:(20,33),7:(22,34),8:(22,34),9:(21,33),10:(18,30),11:(14,25),12:(10,21)}},
        "west_delta": {"humidity": (50, 70), "temp": {1:(10,19),2:(10,20),3:(12,23),4:(15,27),5:(18,31),6:(21,33),7:(23,34),8:(23,34),9:(22,33),10:(19,30),11:(15,25),12:(11,21)}},
        "middle_egypt": {"humidity": (35, 60), "temp": {1:(10,20),2:(10,22),3:(10,26),4:(14,31),5:(18,35),6:(21,37),7:(22,37),8:(22,37),9:(20,35),10:(17,32),11:(12,26),12:(10,21)}},
        "upper_egypt": {"humidity": (25, 50), "temp": {1:(10,22),2:(10,24),3:(11,28),4:(15,34),5:(20,38),6:(23,40),7:(24,41),8:(24,41),9:(22,38),10:(19,35),11:(13,28),12:(10,23)}},
        "north_coast": {"humidity": (60, 80), "temp": {1:(10,18),2:(10,19),3:(12,21),4:(14,24),5:(17,27),6:(21,29),7:(23,30),8:(23,31),9:(22,30),10:(19,28),11:(15,24),12:(11,20)}},
        "sinai_north": {"humidity": (50, 70), "temp": {1:(10,18),2:(10,19),3:(11,22),4:(14,26),5:(17,29),6:(20,32),7:(22,33),8:(22,33),9:(21,31),10:(18,28),11:(14,24),12:(10,20)}},
        "new_lands": {"humidity": (20, 45), "temp": {1:(10,21),2:(10,23),3:(10,27),4:(14,32),5:(18,36),6:(21,39),7:(22,40),8:(22,40),9:(20,37),10:(17,33),11:(11,27),12:(10,22)}},
    }

    if payload.soil_type not in SOIL_PH:
        raise HTTPException(status_code=400, detail=f"Invalid soil type: {payload.soil_type}")

    ph_min, ph_max = SOIL_PH[payload.soil_type]
    if not (ph_min <= payload.ph <= ph_max):
        raise HTTPException(status_code=400, detail=f"Invalid pH {payload.ph} for soil '{payload.soil_type}'. Expected: ({ph_min}-{ph_max})")

    t_min, t_max = REGIONS[region]["temp"][payload.month]
    if not (t_min <= payload.temperature <= t_max):
        raise HTTPException(status_code=400, detail=f"Temperature {payload.temperature}°C unsuitable for month {payload.month} in {payload.governorate}.")

    h_min, h_max = REGIONS[region]["humidity"]
    if not (h_min <= payload.humidity <= h_max):
        raise HTTPException(status_code=400, detail=f"Humidity {payload.humidity}% unsuitable for {payload.governorate}.")

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["N_P_ratio"] = df["N"] / (df["P"] + 1.0)
    df["K_N_ratio"] = df["K"] / (df["N"] + 1.0)
    df["P_K_ratio"] = df["P"] / (df["K"] + 1.0)
    df["npk_sum"] = df["N"] + df["P"] + df["K"]
    df["npk_balance"] = (df["K"] + df["P"]) / (df["N"] + 1.0)
    df["temp_humidity_interaction"] = df["temperature"] * df["humidity"]
    df["temp_ph_interaction"] = df["temperature"] * df["ph"]

    df["humidity_bucket"] = pd.cut(df["humidity"], bins=[0, 35, 50, 65, 80, 100], labels=["very_low", "low", "medium", "high", "very_high"], include_lowest=True).astype(str)
    df["temp_bucket"] = pd.cut(df["temperature"], bins=[0, 18, 24, 30, 36, 50], labels=["cool", "mild", "warm", "hot", "very_hot"], include_lowest=True).astype(str)
    df["ph_bucket"] = pd.cut(df["ph"], bins=[0, 7.4, 7.8, 8.1, 8.6], labels=["low_alkaline", "mild_alkaline", "alkaline", "high_alkaline"], include_lowest=True).astype(str)
    df["season_month"] = df["season"] + "_" + df["month"].astype(str)
    df["region_soil"] = df["region"] + "_" + df["soil_type"]
    return df

@app.get("/")
def root():
    return {"message": "Egypt Crop Recommendation API is running", "docs": "/docs"}

@app.get("/health")
def health_check():
    if model is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="Model or artifacts not loaded.")
    return {
        "status": "healthy",
        "model_loaded": True,
        "governorates_count": len(GOV_TO_REGION),
        "crops_supported": len(WATER_REQUIREMENTS) # <--- التعديل هنا
    }

@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    gov = payload.governorate.lower().strip()
    if gov not in GOV_TO_REGION:
        raise HTTPException(status_code=400, detail="Invalid governorate.")

    region = GOV_TO_REGION[gov]
    season = get_season(payload.month)
    validate_logic(payload, region)

    input_df = pd.DataFrame([{
        "N": payload.N, "P": payload.P, "K": payload.K,
        "temperature": payload.temperature, "humidity": payload.humidity,
        "ph": payload.ph, "month": payload.month, "season": season,
        "soil_type": payload.soil_type, "region": region
    }])

    processed_df = add_features(input_df)
    
    probs = model.predict_proba(processed_df)[0]
    classes = label_encoder.classes_
    top3_idx = probs.argsort()[::-1][:3]
    
    crops_list = []
    for i in top3_idx:
        name = classes[i]
        water = WATER_REQUIREMENTS.get(name, "Water data not available")
        crops_list.append(CropInfo(crop_name=name, water_needs=water))

    return PredictResponse(
        message=f"The best crop to plant is {classes[top3_idx[0]].capitalize()}.",
        top_3_crops=crops_list
    )