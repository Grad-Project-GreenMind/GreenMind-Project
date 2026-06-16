from __future__ import annotations
import os
import pandas as pd
import numpy as np
import difflib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from joblib import load
from fastapi.middleware.cors import CORSMiddleware
from egypt_fertilizer_generator import CROP_NUTRIENTS, CROPS

app = FastAPI(
    title="GreenMind AI - Fertilizer Recommendation API",
    version="2.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "./outputs/egypt_fertilizer_model.joblib"
LABEL_ENCODER_PATH = "./outputs/fertilizer_label_encoder.joblib"
model = None
label_encoder = None

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

class FertilizerRequest(BaseModel):
    N: float
    P: float
    K: float
    ph: float
    temperature: float
    humidity: float
    month: int
    soil_type: str
    governorate: str
    crop_name: str
    growth_stage: str

@app.on_event("startup")
def load_artifacts():
    global model, label_encoder
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    model = load(MODEL_PATH)
    label_encoder = load(LABEL_ENCODER_PATH)

def normalize_key(text: str) -> str:
    return str(text).strip().casefold()

def resolve_region(governorate: str) -> str:
    key = normalize_key(governorate)
    if key not in GOV_TO_REGION:
        raise ValueError(f"Invalid governorate: {governorate}")
    return GOV_TO_REGION[key]

def get_season(month: int) -> str:
    if month not in range(1, 13):
        raise ValueError(f"Invalid month: {month}")
    if month in [11, 12, 1, 2, 3, 4]:
        return "winter"
    elif month in [5, 6]:
        return "summer"
    return "permanent"

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    
    out["N_P_ratio"] = out["N"] / (out["P"].replace(0, 1) + 1.0)
    out["K_N_ratio"] = out["K"] / (out["N"].replace(0, 1) + 1.0)
    out["P_K_ratio"] = out["P"] / (out["K"].replace(0, 1) + 1.0)
    out["N_K_ratio"] = out["N"] / (out["K"].replace(0, 1) + 1.0)
    out["npk_sum"] = out["N"] + out["P" ] + out["K"]
    
    out["NPK_ratio_balance"] = (out["N"] + out["P"]) / (out["K"].replace(0, 1) + 1.0)
    out["N_fraction"] = out["N"] / (out["npk_sum"].replace(0, 1) + 1.0)
    out["P_fraction"] = out["P"] / (out["npk_sum"].replace(0, 1) + 1.0)
    out["K_fraction"] = out["K"] / (out["npk_sum"].replace(0, 1) + 1.0)

    heavy_feeders = ["banana","potato","tomato_summer","tomato_winter","maize","rice","citrus","mint","eggplant","cotton","mango","pepper","cabbage","cucumber"]
    out["is_heavy_feeder"] = out["crop_name"].apply(lambda x: 1 if x in heavy_feeders else 0)

    chloride_tolerant = ["wheat","barley","rice","maize","cotton","sugar_beet","faba_bean","lentil","berseem"]
    out["is_chloride_tolerant"] = out["crop_name"].apply(lambda x: 1 if x in chloride_tolerant else 0)

    out["is_high_alkaline"] = (out["ph"] >= 8.0).astype(int)
    out["is_high_temp"] = (out["temperature"] > 35.0).astype(int)

    out["humidity_bucket"] = pd.cut(out["humidity"], bins=[0, 35, 50, 65, 80, 100], labels=["very_low", "low", "medium", "high", "very_high"], include_lowest=True).astype(str)
    out["temp_bucket"] = pd.cut(out["temperature"], bins=[0, 18, 24, 30, 36, 50], labels=["cool", "mild", "warm", "hot", "very_hot"], include_lowest=True).astype(str)
    out["ph_bucket" ] = pd.cut(out["ph"], bins=[0, 7.4, 7.8, 8.1, 8.6], labels=["low_alkaline", "mild_alkaline", "alkaline", "high_alkaline"], include_lowest=True).astype(str)
    return out

def build_input_sample(N, P, K, temperature, humidity, ph, month, soil_type, governorate, crop_name, growth_stage):
    region = resolve_region(governorate)
    season = get_season(month)
    base = pd.DataFrame([{
        "crop_name": crop_name, "N": float(N), "P": float(P), "K": float(K),
        "temperature": float(temperature), "humidity": float(humidity), "ph": float(ph),
        "season": season, "soil_type": soil_type, "region": region, "growth_stage": growth_stage,
    }])
    return add_features(base), region, season

def analyze_prediction(fertilizer_key: str, crop_name: str, growth_stage: str, N: float, P: float, K: float, ph: float, temperature: float):
    fert_key = fertilizer_key.lower()
    main_problem = ""
    explanation = []

    if fert_key == "no_fertilizer_required":
        main_problem = "Optimal Nutrient Balance Detected"
        explanation.extend(["Your soil currently has an excellent balance of NPK for this stage.", " Care Tips: Focus on regular irrigation cycles and monitoring soil moisture.", "Maintenance: You may add a small dose of organic compost to maintain soil health without chemical fertilizers."])
        return main_problem, explanation

    elif fert_key == "nutrient_excess":
        main_problem = "Nutrient Excess Detected (Risk of Toxicity)"
        explanation.extend(["The detected nutrient levels (N, P, or K) are significantly higher than the optimal requirements.", "Action: Stop applying chemical fertilizers immediately to avoid 'salt burn' and root damage.", "Advice: Increase pure water irrigation to help leach excess salts from the root zone."])
        return main_problem, explanation

    if "molybdate" in fert_key: main_problem = f"Molybdenum (Mo) Sensitivity in {crop_name.capitalize()}"; explanation.append(f"This crop is sensitive to Molybdenum deficiency during the {growth_stage} stage.")
    elif "borax" in fert_key: main_problem = f"Boron (B) Requirement for Flowering/Fruiting"; explanation.append(f"Boron is critical during the {growth_stage} stage to prevent flower drop and improve fruit set.")
    elif "iron_chelate" in fert_key: main_problem = f"Iron (Fe) Unavailability due to High pH ({ph})"; explanation.append(f"High alkalinity locks Iron in the soil. Iron chelate (EDDHA) is the only form the plant can absorb under these conditions.")
    elif "zinc" in fert_key: main_problem = f"Zinc (Zn) Deficiency Risk"; explanation.append(f"Zinc is vital during the {growth_stage} stage, especially in alkaline soils, to ensure proper enzyme function.")
    elif "magnesium" in fert_key: main_problem = f"Magnesium (Mg) Deficiency"; explanation.append(f"Magnesium is the core of chlorophyll. It's highly needed during {growth_stage} for optimal photosynthesis.")
    elif "manganese" in fert_key: main_problem = f"Manganese (Mn) Unavailability"; explanation.append(f"Alkaline/Calcareous soils limit Manganese. Applying this compensates for the deficiency during {growth_stage}.")
    elif "sulphur" in fert_key: main_problem = "High Soil Alkalinity (pH Correction Needed)"; explanation.append("Agricultural sulphur is recommended at the seedling stage to lower soil pH and free up blocked nutrients.")
    elif "humic" in fert_key: main_problem = "Poor Soil Structure / Seedling Establishment"; explanation.append("Humic acid improves root development and nutrient uptake in sandy or reclaimed soils during the seedling stage.")
    else:
        prof = CROP_NUTRIENTS[crop_name]
        deficiencies = []
        if N < prof.optimal_N[0] * 0.85: deficiencies.append("Nitrogen (N)")
        if P < prof.optimal_P[0] * 0.85: deficiencies.append("Phosphorus (P)")
        if K < prof.optimal_K[0] * 0.85: deficiencies.append("Potassium (K)")

        main_problem = f"Macronutrient Deficiency: {', '.join(deficiencies)}" if deficiencies else "Routine Nutrition Maintenance"

        if "calcium_nitrate" in fert_key: explanation.append(f"Calcium Nitrate is highly recommended to prevent physiological disorders and provide a healthy N boost.")
        elif "npk" in fert_key: explanation.append("A balanced NPK formula is recommended to cover multiple nutrient needs.")
        else:
            if any(x in fert_key for x in ["urea", "nitrate", "ammonium", "can"]): explanation.append("A Nitrogen-rich source is chosen to effectively correct the N shortage and boost vegetative growth.")
            if any(x in fert_key for x in ["phosphate", "phosphoric"]): explanation.append("A Phosphorus-rich component is required to stimulate strong root development and energy transfer.")
            if any(x in fert_key for x in ["potassium", "chloride", "sop", "mop"]):
                explanation.append("Potassium is chosen to improve fruit size and resistance to stress.")
                if "chloride" in fert_key: explanation.append("MOP is safe to use here as the crop is chloride-tolerant.")
                elif "sulphate" in fert_key: explanation.append("SOP is preferred here to avoid chloride toxicity.")

    if temperature > 35.0:
        if "urea" not in fert_key and "ammonium_sulphate" not in fert_key: explanation.append(f"Note: Due to the high temperature ({temperature}&deg;C), this specific fertilizer form was selected because it is more stable and performs better under heat stress.")
        elif "urea" in fert_key: explanation.append(f"Warning: Applying Urea at high temperatures ({temperature}&deg;C) may lead to volatilization losses. Ensure it is well-incorporated or irrigated immediately.")

    if not explanation: explanation.append("Selected to effectively address current nutrient requirements based on the crop's specific needs.")

    return main_problem, explanation

@app.get("/")
def root():
    return {"message": "GreenMind AI Fertilizer API is Active", "status": "Running"}

@app.get("/health")
def health_check():
    if model is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="Model or artifacts not loaded.")
    return {
        "status": "healthy",
        "model_loaded": True,
        "governorates_count": len(GOV_TO_REGION),
        "crops_supported": len(CROP_NUTRIENTS)
    }

@app.post("/predict")
def predict_fertilizer_api(payload: FertilizerRequest):
    try:
        raw_crop_name = payload.crop_name.strip()
        crop_key = raw_crop_name.lower()

        if crop_key not in CROP_NUTRIENTS:
            available_crops = list(CROP_NUTRIENTS.keys())
            closest = difflib.get_close_matches(crop_key, available_crops, n=1, cutoff=0.6)
            if closest:
                error_msg = f"Crop '{raw_crop_name}' not recognized. Did you mean '{closest[0]}'?"
                raise HTTPException(status_code=400, detail=error_msg)
            else:
                error_msg = f"System doesn't support '{raw_crop_name}'. Check supported crops list." 
                raise HTTPException(status_code=400, detail=error_msg)

        sample, region, season = build_input_sample(
            payload.N, payload.P, payload.K, 
            payload.temperature, payload.humidity, payload.ph, 
            payload.month, payload.soil_type, payload.governorate, crop_key, payload.growth_stage
        )

        prof = CROP_NUTRIENTS[crop_key]
        spec = CROPS[crop_key]
        heavy_feeders = ["banana","potato","tomato_summer","tomato_winter","maize","rice","citrus","mint","eggplant","cotton","mango","pepper","cabbage","cucumber"]

        pred_label = model.predict(sample)[0]
        fertilizer_key = label_encoder.inverse_transform([pred_label])[0]
        
        confidence = 1.0
        if hasattr(model, "predict_proba"):
            try:
                probs = model.predict_proba(sample)[0]
                confidence = np.max(probs)
            except: pass

        risk_score = 0
        if payload.temperature >= 38: risk_score += 2
        if payload.ph >= 8.0 or payload.ph <= 5.8: risk_score += 2
        if payload.N > 1.2 * prof.optimal_N[1] or payload.P > 1.2 * prof.optimal_P[1] or payload.K > 1.2 * prof.optimal_K[1]: risk_score += 2
        if payload.soil_type in ["sandy", "reclaimed"] and payload.growth_stage == "seedling": risk_score += 2

        is_starving = payload.N < prof.optimal_N[0] * 0.75 or payload.P < prof.optimal_P[0] * 0.75 or payload.K < prof.optimal_K[0] * 0.75
        is_lazy_ml = (fertilizer_key == "no_fertilizer_required")
        apply_rules = (risk_score >= 2) or (confidence < 0.55) or is_starving or is_lazy_ml

        if payload.N > prof.optimal_N[1] * 1.25 or payload.P > prof.optimal_P[1] * 1.25 or payload.K > prof.optimal_K[1] * 1.25:
            fertilizer_key = "nutrient_excess"
            apply_rules = False 

        if apply_rules:
            if fertilizer_key == "urea_46" and payload.temperature > 35:
                fertilizer_key = "calcium_nitrate_155"
            elif fertilizer_key == "potassium_chloride_60" and (spec.chloride_sensitive or payload.soil_type in ["sandy", "reclaimed"]):
                fertilizer_key = "potassium_sulphate_48"
            elif payload.N < prof.optimal_N[0] * 0.70 and payload.P < prof.optimal_P[0] * 0.70 and payload.K < prof.optimal_K[0] * 0.70:
                fertilizer_key = "npk_20_20_20" if crop_key in heavy_feeders else "npk_19_19_19"
            elif payload.P < prof.optimal_P[0] * 0.85 and payload.ph >= 7.8 and fertilizer_key not in ["phosphoric_acid_85", "mono_ammonium_phosphate_12_61", "di_ammonium_phosphate_18_46"]:
                fertilizer_key = "phosphoric_acid_85"
            elif fertilizer_key == "no_fertilizer_required" or risk_score > 0:
                if payload.growth_stage == "seedling" and payload.soil_type in ["sandy", "reclaimed"]:
                    fertilizer_key = "humic_acid_80"
                elif spec.boron_sensitive and payload.growth_stage in ["flowering", "fruiting"]:
                    fertilizer_key = "borax_11"
                elif payload.ph >= 8.2 and spec.iron_sensitive:
                    fertilizer_key = "iron_chelate_eddha_6"
                elif payload.ph >= 8.0 and spec.zinc_sensitive and payload.growth_stage == "vegetative":
                    fertilizer_key = "zinc_sulphate_22"
                elif payload.ph >= 8.2 and payload.growth_stage in ["seedling", "vegetative"] and payload.soil_type in ["calcareous", "reclaimed"]:
                    fertilizer_key = "manganese_sulphate_32"

        main_problem, explanation = analyze_prediction(
            fertilizer_key, crop_key, payload.growth_stage, N=payload.N, P=payload.P, K=payload.K, ph=payload.ph, temperature=payload.temperature
        )

        fert_lower = fertilizer_key.lower()
        if fert_lower in ["no_fertilizer_required", "nutrient_excess"]: 
            app_method = "N/A (Farm Management / Water Irrigation)"
        elif any(x in fert_lower for x in ["chelate", "zinc", "manganese", "molybdate", "borax"]): 
            app_method = "Foliar Spray or Fertigation"
        else: 
            app_method = "Soil Application or Fertigation"

        explanation_lines = "\n".join([f"• {line}" for line in explanation])

        return {
            "Detected Issue": main_problem,
            "Recommendation": fertilizer_key.upper(),
            "App Method": app_method,
            "Why this choice?": explanation_lines
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")