from __future__ import annotations
import os
import time
from dataclasses import dataclass
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

SEED = int(time.time() * 1000) % (2**32)
rng = np.random.default_rng(SEED)

GLOBAL_LIMITS = {
    "N": (0.0, 120.0),
    "P": (0.0, 50.0),
    "K": (0.0, 200.0),
    "ph": (7.0, 8.5),
    "temperature": (10.0, 45.0),
    "humidity": (20.0, 80.0),
}

@dataclass(frozen=True)
class CropSpec:
    season: str
    months: List[int]
    soils: List[str]
    regions: List[str]
    temp_range_c: Tuple[float, float]
    humidity_range_pct: Tuple[float, float]
    ph_range: Tuple[float, float]

CROPS: Dict[str, CropSpec] = {
    "wheat": CropSpec(
        season="winter",
        months=[11, 12, 1, 2, 3, 4],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(10, 24),
        humidity_range_pct=(40, 65),
        ph_range=(7.5, 8.4),
    ),
    "barley": CropSpec(
        season="winter",
        months=[11, 12, 1, 2, 3, 4],
        soils=["sandy", "calcareous", "reclaimed", "loamy_clay"],
        regions=["north_coast", "west_delta", "sinai_north", "new_lands"],
        temp_range_c=(10, 22),
        humidity_range_pct=(35, 62),
        ph_range=(7.4, 8.5),
    ),
    "rice": CropSpec(
        season="summer",
        months=[5, 6, 7, 8, 9],
        soils=["clayey_delta", "alluvial"],
        regions=["north_delta", "south_delta"],
        temp_range_c=(24, 36),
        humidity_range_pct=(65, 80),
        ph_range=(7.2, 8.2),
    ),
    "maize": CropSpec(
        season="summer",
        months=[5, 6, 7, 8, 9],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(22, 37),
        humidity_range_pct=(45, 70),
        ph_range=(7.2, 8.3),
    ),
    "cotton": CropSpec(
        season="summer",
        months=[4, 5, 6, 7, 8, 9],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt"],
        temp_range_c=(24, 38),
        humidity_range_pct=(45, 68),
        ph_range=(7.4, 8.5),
    ),
    "sugar_beet": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3, 4],
        soils=["clayey_delta", "loamy_clay", "sandy", "calcareous"],
        regions=["north_delta", "south_delta", "west_delta"],
        temp_range_c=(10, 22),
        humidity_range_pct=(45, 70),
        ph_range=(7.4, 8.5),
    ),
    "faba_bean": CropSpec(
        season="winter",
        months=[11, 12, 1, 2, 3, 4],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt"],
        temp_range_c=(10, 22),
        humidity_range_pct=(45, 68),
        ph_range=(7.3, 8.3),
    ),
    "lentil": CropSpec(
        season="winter",
        months=[11, 12, 1, 2, 3, 4],
        soils=["sandy", "calcareous", "reclaimed", "loamy_clay"],
        regions=["west_delta", "sinai_north", "new_lands", "middle_egypt"],
        temp_range_c=(10, 24),
        humidity_range_pct=(35, 60),
        ph_range=(7.4, 8.5),
    ),
    "berseem": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3, 4],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt"],
        temp_range_c=(10, 24),
        humidity_range_pct=(45, 72),
        ph_range=(7.3, 8.3),
    ),
    "tomato_winter": CropSpec(
        season="winter",
        months=[9, 10, 11, 12, 1, 2],
        soils=["clayey_delta", "loamy_clay", "sandy", "alluvial"],
        regions=["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt"],
        temp_range_c=(12, 25),
        humidity_range_pct=(50, 75),
        ph_range=(7.2, 8.3),
    ),
    "tomato_summer": CropSpec(
        season="summer",
        months=[3, 4, 5, 6, 7, 8],
        soils=["clayey_delta", "loamy_clay", "sandy", "alluvial"],
        regions=["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(20, 35),
        humidity_range_pct=(50, 75),
        ph_range=(7.2, 8.3),
    ),
    "potato": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2],
        soils=["loamy_clay", "sandy", "alluvial"],
        regions=["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt"],
        temp_range_c=(10, 24),
        humidity_range_pct=(50, 75),
        ph_range=(7.2, 8.3),
    ),
    "onion": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3, 4],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(10, 28),
        humidity_range_pct=(35, 68),
        ph_range=(7.4, 8.5),
    ),
    "garlic": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3, 4],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(10, 26),
        humidity_range_pct=(40, 68),
        ph_range=(7.4, 8.5),
    ),
    "eggplant": CropSpec(
        season="summer",
        months=[4, 5, 6, 7, 8, 9],
        soils=["clayey_delta", "loamy_clay", "alluvial", "sandy"],
        regions=["north_delta", "south_delta", "east_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(24, 37),
        humidity_range_pct=(48, 72),
        ph_range=(7.2, 8.3),
    ),
    "pepper": CropSpec(
        season="summer",
        months=[4, 5, 6, 7, 8, 9],
        soils=["clayey_delta", "loamy_clay", "alluvial", "sandy"],
        regions=["north_delta", "south_delta", "east_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(20, 32),
        humidity_range_pct=(52, 76),
        ph_range=(7.2, 8.2),
    ),
    "cabbage": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3],
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt"],
        temp_range_c=(10, 22),
        humidity_range_pct=(50, 75),
        ph_range=(7.2, 8.3),
    ),
    "cucumber": CropSpec(
        season="summer",
        months=[3, 4, 5, 6, 7, 8, 9],
        soils=["clayey_delta", "loamy_clay", "sandy", "alluvial"],
        regions=["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt"],
        temp_range_c=(18, 32),
        humidity_range_pct=(58, 80),
        ph_range=(7.2, 8.3),
    ),
    "watermelon": CropSpec(
        season="summer",
        months=[4, 5, 6, 7, 8],
        soils=["sandy", "calcareous", "reclaimed"],
        regions=["east_delta", "west_delta", "upper_egypt", "new_lands", "sinai_north"],
        temp_range_c=(24, 39),
        humidity_range_pct=(35, 62),
        ph_range=(7.4, 8.5),
    ),
    "citrus": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["loamy_clay", "sandy", "alluvial", "reclaimed"],
        regions=["east_delta", "west_delta", "middle_egypt", "upper_egypt", "new_lands"],
        temp_range_c=(12, 38),
        humidity_range_pct=(45, 75),
        ph_range=(7.2, 8.3),
    ),
    "mango": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["sandy", "loamy_clay", "reclaimed"],
        regions=["east_delta", "middle_egypt", "upper_egypt", "aswan", "new_lands"],
        temp_range_c=(15, 40),
        humidity_range_pct=(40, 75),
        ph_range=(7.4, 8.5),
    ),
    "banana": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["south_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(20, 35),
        humidity_range_pct=(60, 80),
        ph_range=(7.2, 8.0),
    ),
    "grapes": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["sandy", "calcareous", "reclaimed", "loamy_clay"],
        regions=["west_delta", "middle_egypt", "upper_egypt", "sinai_north", "new_lands"],
        temp_range_c=(12, 38),
        humidity_range_pct=(35, 65),
        ph_range=(7.4, 8.5),
    ),
    "date_palm": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["sandy", "calcareous", "reclaimed"],
        regions=["upper_egypt", "aswan", "new_lands"],
        temp_range_c=(18, 42),
        humidity_range_pct=(20, 50),
        ph_range=(7.4, 8.5),
    ),
    "olive": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["sandy", "calcareous", "reclaimed"],
        regions=["north_coast", "sinai_north", "west_delta", "new_lands"],
        temp_range_c=(10, 38),
        humidity_range_pct=(30, 62),
        ph_range=(7.4, 8.5),
    ),
    "pomegranate": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["sandy", "calcareous", "reclaimed", "loamy_clay"],
        regions=["middle_egypt", "upper_egypt", "new_lands", "west_delta"],
        temp_range_c=(14, 40),
        humidity_range_pct=(30, 65),
        ph_range=(7.4, 8.5),
    ),
    "mint": CropSpec(
        season="permanent",
        months=list(range(1, 13)),
        soils=["clayey_delta", "loamy_clay", "alluvial"],
        regions=["north_delta", "south_delta", "middle_egypt"],
        temp_range_c=(15, 32),
        humidity_range_pct=(55, 80),
        ph_range=(7.2, 8.3),
    ),
    "basil": CropSpec(
        season="summer",
        months=[4, 5, 6, 7, 8, 9],
        soils=["loamy_clay", "alluvial", "sandy"],
        regions=["north_delta", "south_delta", "east_delta", "middle_egypt", "upper_egypt"],
        temp_range_c=(18, 33),
        humidity_range_pct=(45, 75),
        ph_range=(7.2, 8.3),
    ),
    "coriander": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3],
        soils=["loamy_clay", "alluvial", "sandy"],
        regions=["north_delta", "south_delta", "middle_egypt", "west_delta"],
        temp_range_c=(10, 25),
        humidity_range_pct=(40, 70),
        ph_range=(7.4, 8.5),
    ),
    "cumin": CropSpec(
        season="winter",
        months=[10, 11, 12, 1, 2, 3],
        soils=["loamy_clay", "alluvial", "sandy", "calcareous"],
        regions=["west_delta", "middle_egypt", "upper_egypt", "new_lands"],
        temp_range_c=(10, 25),
        humidity_range_pct=(35, 60),
        ph_range=(7.4, 8.5),
    ),
}

REGIONS = {
    "north_coast": {
        "monthly_temp": {1:(10,18),2:(10,19),3:(12,21),4:(14,24),5:(17,27),6:(21,29),7:(23,30),8:(23,31),9:(22,30),10:(19,28),11:(15,24),12:(11,20)},
        "humidity_range": (60, 80),
        "soil_types": ["calcareous", "sandy"],
    },
    "north_delta": {
        "monthly_temp": {1:(10,18),2:(10,19),3:(11,22),4:(14,26),5:(17,30),6:(20,32),7:(22,33),8:(22,33),9:(21,32),10:(18,29),11:(14,24),12:(10,20)},
        "humidity_range": (55, 80),
        "soil_types": ["clayey_delta", "alluvial"],
    },
    "south_delta": {
        "monthly_temp": {1:(10,19),2:(10,21),3:(12,24),4:(15,28),5:(18,32),6:(21,34),7:(23,35),8:(23,35),9:(22,33),10:(19,30),11:(15,25),12:(11,21)},
        "humidity_range": (45, 65),
        "soil_types": ["clayey_delta", "loamy_clay", "alluvial"],
    },
    "east_delta": {
        "monthly_temp": {1:(10,19),2:(10,20),3:(11,23),4:(14,27),5:(17,31),6:(20,33),7:(22,34),8:(22,34),9:(21,33),10:(18,30),11:(14,25),12:(10,21)},
        "humidity_range": (50, 70),
        "soil_types": ["sandy", "clayey_delta", "alluvial"],
    },
    "west_delta": {
        "monthly_temp": {1:(10,19),2:(10,20),3:(12,23),4:(15,27),5:(18,31),6:(21,33),7:(23,34),8:(23,34),9:(22,33),10:(19,30),11:(15,25),12:(11,21)},
        "humidity_range": (50, 70),
        "soil_types": ["calcareous", "loamy_clay", "reclaimed"],
    },
    "middle_egypt": {
        "monthly_temp": {1:(10,20),2:(10,22),3:(10,26),4:(14,31),5:(18,35),6:(21,37),7:(22,37),8:(22,37),9:(20,35),10:(17,32),11:(12,26),12:(10,21)},
        "humidity_range": (35, 60),
        "soil_types": ["loamy_clay", "alluvial", "reclaimed"],
    },
    "upper_egypt": {
        "monthly_temp": {1:(10,22),2:(10,24),3:(11,28),4:(15,34),5:(20,38),6:(23,40),7:(24,41),8:(24,41),9:(22,38),10:(19,35),11:(13,28),12:(10,23)},
        "humidity_range": (25, 50),
        "soil_types": ["loamy_clay", "alluvial", "sandy"],
    },
    "aswan": {
        "monthly_temp": {1:(10,23),2:(11,25),3:(14,29),4:(19,35),5:(23,39),6:(25,41),7:(26,42),8:(26,42),9:(24,40),10:(21,36),11:(16,30),12:(11,25)},
        "humidity_range": (20, 45),
        "soil_types": ["sandy", "reclaimed", "alluvial"],
    },
    "sinai_north": {
        "monthly_temp": {1:(10,18),2:(10,19),3:(11,22),4:(14,26),5:(17,29),6:(20,32),7:(22,33),8:(22,33),9:(21,31),10:(18,28),11:(14,24),12:(10,20)},
        "humidity_range": (50, 70),
        "soil_types": ["sandy", "calcareous", "reclaimed"],
    },
    "new_lands": {
        "monthly_temp": {1:(10,21),2:(10,23),3:(10,27),4:(14,32),5:(18,36),6:(21,39),7:(22,40),8:(22,40),9:(20,37),10:(17,33),11:(11,27),12:(10,22)},
        "humidity_range": (20, 45),
        "soil_types": ["sandy", "calcareous", "reclaimed"],
    },
}

SOIL_PH = {
    "clayey_delta": (7.8, 8.5),
    "loamy_clay": (7.6, 8.1),
    "alluvial": (7.5, 8.2),
    "sandy": (7.2, 7.9),
    "calcareous": (7.6, 8.3),
    "reclaimed": (7.4, 8.4),
}

REQUIRED_COLUMNS = [
    "N", "P", "K", "temperature", "humidity", "ph",
    "month", "season", "soil_type", "region", "label"
]

def clip_to_global(col_name: str, value: float) -> float:
    lo, hi = GLOBAL_LIMITS[col_name]
    return float(np.clip(value, lo, hi))

def bounded_normal(mean: float, sd: float, lo: float, hi: float) -> float:
    value = rng.normal(mean, sd)
    return float(np.clip(value, lo, hi))

def generate_npk(crop_name: str) -> Tuple[float, float, float]:
    profiles = {
        "wheat":         (66, 24, 18, 7, 3, 6),
        "barley":        (38, 16, 30, 6, 3, 7),
        "rice":          (92, 22, 48, 8, 3, 8),
        "maize":         (104, 28, 34, 8, 3, 7),
        "cotton":        (72, 24, 70, 7, 3, 8),
        "sugar_beet":    (48, 31, 40, 7, 4, 8),
        "faba_bean":     (24, 29, 38, 5, 3, 7),
        "lentil":        (18, 20, 24, 4, 3, 6),
        "berseem":       (20, 20, 16, 4, 3, 5),
        "tomato_winter": (80, 35, 96, 7, 3, 8),
        "tomato_summer": (90, 37, 108, 7, 3, 8),
        "potato":        (82, 43, 126, 7, 3, 9),
        "onion":         (60, 22, 54, 6, 3, 7),
        "garlic":        (50, 20, 68, 6, 3, 7),
        "eggplant":      (78, 22, 86, 7, 3, 8),
        "pepper":        (66, 28, 62, 6, 3, 7),
        "cabbage":       (58, 25, 66, 6, 3, 7),
        "cucumber":      (58, 20, 92, 6, 3, 8),
        "watermelon":    (40, 18, 78, 5, 3, 8),
        "citrus":        (86, 24, 90, 8, 3, 9),
        "mango":         (70, 22, 76, 8, 3, 9),
        "banana":        (108, 34, 148, 7, 3, 9),
        "grapes":        (62, 31, 92, 6, 3, 8),
        "date_palm":     (34, 11, 54, 5, 2, 6),
        "olive":         (28, 15, 48, 4, 2, 6),
        "pomegranate":   (42, 20, 66, 5, 3, 7),
        "mint":          (88, 30, 66, 7, 3, 7),
        "basil":         (56, 22, 52, 6, 3, 6),
        "coriander":     (36, 18, 32, 5, 3, 5),
        "cumin":         (32, 24, 28, 5, 3, 5),
    }

    mu_n, mu_p, mu_k, sd_n, sd_p, sd_k = profiles.get(crop_name, (55, 25, 55, 10, 5, 10))
    N = clip_to_global("N", rng.normal(mu_n, sd_n))
    P = clip_to_global("P", rng.normal(mu_p, sd_p))
    K = clip_to_global("K", rng.normal(mu_k, sd_k))
    return N, P, K

def generate_temperature(crop_name: str, spec: CropSpec, region: str, month: int) -> float:
    region_lo, region_hi = REGIONS[region]["monthly_temp"][month]
    region_mid = (region_lo + region_hi) / 2

    crop_means = {
        "wheat": 17.5,
        "barley": 16.5,
        "rice": 30.0,
        "maize": 33.0,
        "cotton": 31.0,
        "sugar_beet": 18.0,
        "faba_bean": 16.5,
        "lentil": 17.0,
        "berseem": 16.0,
        "tomato_winter": 20.0,
        "tomato_summer": 30.0,
        "potato": 18.0,
        "onion": 20.0,
        "garlic": 17.5,
        "eggplant": 32.0,
        "pepper": 27.5,
        "cabbage": 16.0,
        "cucumber": 27.0,
        "watermelon": 33.5,
        "citrus": 27.5,
        "mango": 31.5,
        "banana": 29.0,
        "grapes": 27.0,
        "date_palm": 37.5,
        "olive": 24.0,
        "pomegranate": 30.0,
        "mint": 24.0,
        "basil": 28.0,
        "coriander": 18.0,
        "cumin": 20.0,
    }

    crop_mean = crop_means.get(crop_name, region_mid)
    mean = 0.60 * crop_mean + 0.40 * region_mid

    sd = 1.5
    if crop_name in {"eggplant", "pepper", "garlic", "onion", "cotton"}:
        sd = 1.2

    temp = bounded_normal(mean, sd, spec.temp_range_c[0], spec.temp_range_c[1])
    return clip_to_global("temperature", temp)

def generate_humidity(crop_name: str, spec: CropSpec, region: str, temperature: float) -> float:
    region_lo, region_hi = REGIONS[region]["humidity_range"]
    region_mid = (region_lo + region_hi) / 2

    crop_means = {
        "rice": 74,
        "wheat": 56,
        "barley": 47,
        "maize": 50,
        "cotton": 56,
        "tomato_winter": 67,
        "tomato_summer": 60,
        "potato": 65,
        "onion": 50,
        "garlic": 58,
        "eggplant": 56,
        "pepper": 67,
        "cabbage": 66,
        "cucumber": 72,
        "watermelon": 42,
        "banana": 74,
        "date_palm": 30,
        "olive": 42,
        "mint": 74,
    }

    crop_mean = crop_means.get(crop_name, (spec.humidity_range_pct[0] + spec.humidity_range_pct[1]) / 2)
    mean = 0.62 * crop_mean + 0.38 * region_mid

    if temperature > 32:
        mean -= rng.uniform(3, 6)
    elif temperature < 18:
        mean += rng.uniform(1, 3)

    sd = 3.5
    if crop_name in {"eggplant", "pepper", "garlic", "onion", "cotton"}:
        sd = 2.8

    humidity = bounded_normal(mean, sd, spec.humidity_range_pct[0], spec.humidity_range_pct[1])
    return clip_to_global("humidity", humidity)

def generate_ph(soil_type: str, spec: CropSpec, crop_name: str) -> float:
    soil_lo, soil_hi = SOIL_PH[soil_type]
    ph_lo = max(soil_lo, spec.ph_range[0], GLOBAL_LIMITS["ph"][0])
    ph_hi = min(soil_hi, spec.ph_range[1], GLOBAL_LIMITS["ph"][1])

    if ph_lo > ph_hi:
        ph_lo, ph_hi = GLOBAL_LIMITS["ph"]

    crop_ph_bias = {
        "pepper": 7.55,
        "eggplant": 7.85,
        "garlic": 8.05,
        "onion": 7.95,
        "cotton": 8.10,
        "potato": 7.70,
        "rice": 7.85,
        "watermelon": 7.60,
        "olive": 7.85,
        "date_palm": 8.05,
    }

    if crop_name in crop_ph_bias:
        mean = min(max(crop_ph_bias[crop_name], ph_lo), ph_hi)
        ph = bounded_normal(mean, 0.07, ph_lo, ph_hi)
    elif soil_type == "sandy":
        ph = bounded_normal(7.6, 0.08, ph_lo, ph_hi)
    elif soil_type == "clayey_delta":
        ph = bounded_normal(8.15, 0.08, ph_lo, ph_hi)
    else:
        ph = bounded_normal((ph_lo + ph_hi) / 2, 0.10, ph_lo, ph_hi)

    return clip_to_global("ph", ph)


def choose_region(spec: CropSpec) -> str:
    return str(rng.choice(spec.regions))


def choose_soil(spec: CropSpec, region_name: str) -> str:
    region_soils = set(REGIONS[region_name]["soil_types"])
    valid_soils = [soil for soil in spec.soils if soil in region_soils]
    if not valid_soils:
        valid_soils = spec.soils
    return str(rng.choice(valid_soils))

def generate_sample(crop_name: str, spec: CropSpec) -> dict:
    region = choose_region(spec)
    soil_type = choose_soil(spec, region)
    month = int(rng.choice(spec.months))

    N, P, K = generate_npk(crop_name)
    temperature = generate_temperature(crop_name, spec, region, month)
    humidity = generate_humidity(crop_name, spec, region, temperature)
    ph = generate_ph(soil_type, spec, crop_name)

    return {
        "N": round(N, 2),
        "P": round(P, 2),
        "K": round(K, 2),
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "ph": round(ph, 2),
        "month": month,
        "season": spec.season,
        "soil_type": soil_type,
        "region": region,
        "label": crop_name,
    }

def generate_dataset(n_rows: int = 13000) -> pd.DataFrame:
    crop_names = list(CROPS.keys())
    rows = []

    per_crop = n_rows // len(crop_names)
    remainder = n_rows % len(crop_names)

    for crop_name in crop_names:
        for _ in range(per_crop):
            rows.append(generate_sample(crop_name, CROPS[crop_name]))

    if remainder > 0:
        extra_crops = rng.choice(crop_names, size=remainder, replace=True)
        for crop_name in extra_crops:
            rows.append(generate_sample(str(crop_name), CROPS[str(crop_name)]))

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)
    return df

def validate_dataset(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    if "annual_rainfall_mm" in df.columns:
        raise ValueError("Column 'annual_rainfall_mm' should not exist.")

    null_counts = df[REQUIRED_COLUMNS].isnull().sum()
    bad_nulls = null_counts[null_counts > 0]
    if not bad_nulls.empty:
        raise ValueError(f"Null values found:\n{bad_nulls}")

    violations = {}
    for col, (lo, hi) in GLOBAL_LIMITS.items():
        bad = df[(df[col] < lo) | (df[col] > hi)]
        if not bad.empty:
            violations[col] = {
                "count": len(bad),
                "min_found": float(df[col].min()),
                "max_found": float(df[col].max()),
                "allowed_range": (lo, hi),
            }

    if violations:
        raise ValueError(f"Range violations found:\n{violations}")

    bad_month = df[(df["month"] < 1) | (df["month"] > 12)]
    if not bad_month.empty:
        raise ValueError(f"Invalid month values found: {len(bad_month)}")

if __name__ == "__main__":
    N_ROWS = 13000

    print(f"Seed: {SEED}")
    print(f"Generating {N_ROWS} rows...")

    df = generate_dataset(N_ROWS)
    validate_dataset(df)
    out_dir = "./outputs"
    os.makedirs(out_dir, exist_ok=True)

    out_path = os.path.join(out_dir, "egypt_crop_recommendation.csv")
    df.to_csv(out_path, index=False)

    print(f"\n[OK] Dataset generated successfully: {out_path}")
    print(f"Rows: {len(df)}")
    print(f"Unique crops: {df['label'].nunique()}")
    print("\nNumeric summary:")
    print(df[["N", "P", "K", "temperature", "humidity", "ph"]].describe().round(2).to_string())