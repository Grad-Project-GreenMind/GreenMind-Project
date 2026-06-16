import pandas as pd
from joblib import load

MODEL_PATH = "./outputs/egypt_crop_model.joblib"
LABEL_ENCODER_PATH = "./outputs/label_encoder.joblib"

GOV_TO_REGION = {
    "cairo": "middle_egypt", "القاهرة": "middle_egypt",
    "giza": "middle_egypt", "الجيزة": "middle_egypt",
    "fayoum": "middle_egypt", "الفيوم": "middle_egypt",
    "beni suef": "middle_egypt", "بني سويف": "middle_egypt",
    "minya": "middle_egypt", "المنيا": "middle_egypt",
    "alexandria": "north_coast", "الإسكندرية": "north_coast",
    "matrouh": "north_coast", "مطروح": "north_coast",
    "beheira": "west_delta", "البحيرة": "west_delta",
    "kafr el sheikh": "north_delta", "كفر الشيخ": "north_delta",
    "dakahlia": "north_delta", "الدقهلية": "north_delta",
    "damietta": "north_delta", "دمياط": "north_delta",
    "gharbia": "south_delta", "الغربية": "south_delta",
    "menoufia": "south_delta", "المنوفية": "south_delta",
    "qalyubia": "south_delta", "القليوبية": "south_delta",
    "sharqia": "east_delta", "الشرقية": "east_delta",
    "ismailia": "east_delta", "الإسماعيلية": "east_delta",
    "suez": "east_delta", "السويس": "east_delta",
    "port said": "east_delta", "بورسعيد": "east_delta",
    "assiut": "upper_egypt", "أسيوط": "upper_egypt",
    "sohag": "upper_egypt", "سوهاج": "upper_egypt",
    "qena": "upper_egypt", "قنا": "upper_egypt",
    "luxor": "upper_egypt", "الأقصر": "upper_egypt",
    "aswan": "upper_egypt", "أسوان": "upper_egypt",
    "red sea": "upper_egypt", "البحر الأحمر": "upper_egypt",
    "north sinai": "sinai_north", "شمال سيناء": "sinai_north",
    "south sinai": "sinai_north", "جنوب سيناء": "sinai_north",
    "new valley": "new_lands", "الوادي الجديد": "new_lands",
}
REGIONS = {
    "north_delta": {
        "humidity": (55, 80),
        "temp": {1:(10,18),2:(10,19),3:(11,22),4:(14,26),5:(17,30),6:(20,32),
                 7:(22,33),8:(22,33),9:(21,32),10:(18,29),11:(14,24),12:(10,20)}
    },
    "south_delta": {
        "humidity": (45, 65),
        "temp": {1:(10,19),2:(10,21),3:(12,24),4:(15,28),5:(18,32),6:(21,34),
                 7:(23,35),8:(23,35),9:(22,33),10:(19,30),11:(15,25),12:(11,21)}
    },
    "east_delta": {
        "humidity": (50, 70),
        "temp": {1:(10,19),2:(10,20),3:(11,23),4:(14,27),5:(17,31),6:(20,33),
                 7:(22,34),8:(22,34),9:(21,33),10:(18,30),11:(14,25),12:(10,21)}
    },
    "west_delta": {
        "humidity": (50, 70),
        "temp": {1:(10,19),2:(10,20),3:(12,23),4:(15,27),5:(18,31),6:(21,33),
                 7:(23,34),8:(23,34),9:(22,33),10:(19,30),11:(15,25),12:(11,21)}
    },
    "middle_egypt": {
        "humidity": (35, 60),
        "temp": {1:(10,20),2:(10,22),3:(10,26),4:(14,31),5:(18,35),6:(21,37),
                 7:(22,37),8:(22,37),9:(20,35),10:(17,32),11:(12,26),12:(10,21)}
    },
    "upper_egypt": {
        "humidity": (25, 50),
        "temp": {1:(10,22),2:(10,24),3:(11,28),4:(15,34),5:(20,38),6:(23,40),
                 7:(24,41),8:(24,41),9:(22,38),10:(19,35),11:(13,28),12:(10,23)}
    },
    "north_coast": {
        "humidity": (60, 80),
        "temp": {1:(10,18),2:(10,19),3:(12,21),4:(14,24),5:(17,27),6:(21,29),
                 7:(23,30),8:(23,31),9:(22,30),10:(19,28),11:(15,24),12:(11,20)}
    },
    "sinai_north": {
        "humidity": (50, 70),
        "temp": {1:(10,18),2:(10,19),3:(11,22),4:(14,26),5:(17,29),6:(20,32),
                 7:(22,33),8:(22,33),9:(21,31),10:(18,28),11:(14,24),12:(10,20)}
    },
    "new_lands": {
        "humidity": (20, 45),
        "temp": {1:(10,21),2:(10,23),3:(10,27),4:(14,32),5:(18,36),6:(21,39),
                 7:(22,40),8:(22,40),9:(20,37),10:(17,33),11:(11,27),12:(10,22)}
    },
}

SOIL_PH = {
    "clayey_delta": (7.8, 8.5),
    "loamy_clay":   (7.6, 8.1),
    "alluvial":     (7.5, 8.2),
    "sandy":        (7.2, 7.9),
    "calcareous":   (7.6, 8.3),
    "reclaimed":    (7.4, 8.4),
}

def get_season(month: int) -> str:
    if month in [11, 12, 1, 2, 3, 4]:
        return "winter"
    elif month in [5, 6]:
        return "summer"
    else: 
        return "permanent"

def validate(soil_type, ph, month, temperature, humidity, region):
    if soil_type not in SOIL_PH:
        raise ValueError(f"Invalid soil_type '{soil_type}'")

    ph_min, ph_max = SOIL_PH[soil_type]
    if not (ph_min <= ph <= ph_max):
        raise ValueError(
            f"Invalid pH {ph} for soil '{soil_type}' (expected {ph_min}-{ph_max})"
        )

    t_min, t_max = REGIONS[region]["temp"][month]
    if not (t_min <= temperature <= t_max):
        raise ValueError(
            f"Temperature {temperature}°C not suitable for month {month} "
            f"in {region} (expected {t_min}-{t_max})"
        )
    h_min, h_max = REGIONS[region]["humidity"]
    if not (h_min <= humidity <= h_max):
        raise ValueError(
            f"Humidity {humidity}% not suitable for {region} "
            f"(expected {h_min}-{h_max})"
        )
def add_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    out["N_P_ratio"] = out["N"] / (out["P"] + 1.0)
    out["K_N_ratio"] = out["K"] / (out["N"] + 1.0)
    out["P_K_ratio"] = out["P"] / (out["K"] + 1.0)

    out["temp_humidity_interaction"] = out["temperature"] * out["humidity"]
    out["temp_ph_interaction"] = out["temperature"] * out["ph"]
    out["npk_sum"] = out["N"] + out["P"] + out["K"]
    out["npk_balance"] = (out["K"] + out["P"]) / (out["N"] + 1.0)

    out["humidity_bucket"] = pd.cut(
        out["humidity"],
        bins=[0, 35, 50, 65, 80, 100],
        labels=["very_low", "low", "medium", "high", "very_high"],
        include_lowest=True,
    ).astype(str)

    out["temp_bucket"] = pd.cut(
        out["temperature"],
        bins=[0, 18, 24, 30, 36, 50],
        labels=["cool", "mild", "warm", "hot", "very_hot"],
        include_lowest=True,
    ).astype(str)

    out["ph_bucket"] = pd.cut(
        out["ph"],
        bins=[0, 7.4, 7.8, 8.1, 8.6],
        labels=["low_alkaline", "mild_alkaline", "alkaline", "high_alkaline"],
        include_lowest=True,
    ).astype(str)

    out["season_month"] = out["season"] + "_" + out["month"].astype(int).astype(str)
    out["region_soil"] = out["region"] + "_" + out["soil_type"]

    return out

def build_input_sample(
    N: float,
    P: float,
    K: float,
    temperature: float,
    humidity: float,
    ph: float,
    month: int,
    soil_type: str,
    governorate: str,
) -> tuple[pd.DataFrame, str, str]:
   
    gov_key = governorate.lower().strip()
    if gov_key not in GOV_TO_REGION:
        raise ValueError(f"Invalid governorate '{governorate}'")
    region = GOV_TO_REGION[gov_key]

    season = get_season(month)
    validate(soil_type, ph, month, temperature, humidity, region)

    base = pd.DataFrame([{
        "N": N,
        "P": P,
        "K": K,
        "temperature": temperature,
        "humidity": humidity,
        "ph": ph,
        "month": month,
        "season": season,
        "soil_type": soil_type,
        "region": region,
    }])

    return add_features(base), region, season
def get_top_k_crops(model, label_encoder, sample_df: pd.DataFrame, top_k: int = 3):
    proba = model.predict_proba(sample_df)[0]
    classes = label_encoder.classes_
    top_idx = proba.argsort()[::-1][:top_k]
    return [classes[i] for i in top_idx]
def main():
    print("Loading model")
    model = load(MODEL_PATH)

    print("Loading label encoder")
    label_encoder = load(LABEL_ENCODER_PATH)

    try:
        sample, region, season = build_input_sample(
N = 28.5,
P = 15.2,
K = 48.6,
temperature = 24,
humidity = 60,
ph = 8.1,
month = 4,
soil_type = "calcareous",
governorate = "matrouh"
        )
    except ValueError as e:
        print(f"\n[ERROR] {e}")
        return

    print(f"\nRegion: {region}")
    print(f"Season: {season}")

    print("\nInput sample:")
    print(sample[[
        "N", "P", "K", "temperature", "humidity", "ph",
        "month", "season", "soil_type", "region"
    ]].to_string(index=False))

    crops = get_top_k_crops(model, label_encoder, sample, top_k=3)

    print("\nTop 3 recommended crops:")
    for i, crop in enumerate(crops, start=1):
        print(f"{i}. {crop}")

    print(f"\nThe best crop to plant is: {crops[0]}")

if __name__ == "__main__":
    main()