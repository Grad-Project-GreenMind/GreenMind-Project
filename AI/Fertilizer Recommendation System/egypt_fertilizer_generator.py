from __future__ import annotations
import os
import time
import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Dict, List, Tuple


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

SEASONS = ["winter", "summer", "permanent"]
GROWTH_STAGES = ["seedling", "vegetative", "flowering", "fruiting"]
REQUIRED_COLUMNS = [
    "crop_name", "N", "P", "K", "temperature", "humidity",
    "ph", "season", "soil_type", "region", "growth_stage", "label"
]

NO_FERTILIZER_CLASS = "no_fertilizer_required"
NUTRIENT_EXCESS_CLASS = "nutrient_excess"

@dataclass(frozen=True)
class Fertilizer:
    key: str
    commercial_name: str
    scientific_name: str
    nutrient_content: str
    primary_nutrient: str

@dataclass(frozen=True)
class CropSpec:
    season: str
    soils: List[str]
    regions: List[str]
    temp_range_c: Tuple[float, float]
    humidity_range_pct: Tuple[float, float]
    ph_range: Tuple[float, float]
    chloride_sensitive: bool
    iron_sensitive: bool
    zinc_sensitive: bool
    boron_sensitive: bool
    mg_sensitive: bool
    mo_sensitive: bool
    sulphur_responsive: bool

@dataclass(frozen=True)
class CropNutrientProfile:
    optimal_N: Tuple[float, float]
    optimal_P: Tuple[float, float]
    optimal_K: Tuple[float, float]

FERTILIZER_CATALOG: Dict[str, Fertilizer] = {
    "urea_46": Fertilizer("urea_46", "Urea", "Carbamide", "46-0-0", "N"),
    "ammonium_nitrate_335": Fertilizer("ammonium_nitrate_335", "Ammonium Nitrate", "NH4NO3", "33.5-0-0", "N"),
    "ammonium_sulphate_206": Fertilizer("ammonium_sulphate_206", "Ammonium Sulphate", "(NH4)2SO4", "20.6-0-0 + S", "N"),
    "calcium_ammonium_nitrate_26": Fertilizer("calcium_ammonium_nitrate_26", "CAN", "CAN", "26-0-0", "N"),
    "calcium_nitrate_155": Fertilizer("calcium_nitrate_155", "Calcium Nitrate", "Ca(NO3)2", "15.5-0-0", "N"),
    "single_super_phosphate_15": Fertilizer("single_super_phosphate_15", "SSP", "SSP", "0-15-0", "P"),
    "triple_super_phosphate_46": Fertilizer("triple_super_phosphate_46", "TSP", "TSP", "0-46-0", "P"),
    "phosphoric_acid_85": Fertilizer("phosphoric_acid_85", "Phosphoric Acid", "H3PO4", "0-61-0", "P"),
    "di_ammonium_phosphate_18_46": Fertilizer("di_ammonium_phosphate_18_46", "DAP", "DAP", "18-46-0", "NP"),
    "mono_ammonium_phosphate_12_61": Fertilizer("mono_ammonium_phosphate_12_61", "MAP", "MAP", "12-61-0", "NP"),
    "potassium_sulphate_48": Fertilizer("potassium_sulphate_48", "SOP", "K2SO4", "0-0-48", "K"),
    "potassium_chloride_60": Fertilizer("potassium_chloride_60", "MOP", "KCl", "0-0-60", "K"),
    "potassium_nitrate_13_0_46": Fertilizer("potassium_nitrate_13_0_46", "KNO3", "KNO3", "13-0-46", "NK"),
    "npk_19_19_19": Fertilizer("npk_19_19_19", "NPK 19-19-19", "NPK", "19-19-19", "NPK"),
    "npk_20_20_20": Fertilizer("npk_20_20_20", "NPK 20-20-20", "NPK", "20-20-20", "NPK"),
    "iron_chelate_eddha_6": Fertilizer("iron_chelate_eddha_6", "Fe-EDDHA", "Chelate", "Fe", "Fe"),
    "zinc_sulphate_22": Fertilizer("zinc_sulphate_22", "ZnSO4", "ZnSO4", "Zn", "Zn"),
    "manganese_sulphate_32": Fertilizer("manganese_sulphate_32", "MnSO4", "MnSO4", "Mn", "Mn"),
    "agricultural_sulphur_99": Fertilizer("agricultural_sulphur_99", "Sulphur", "S", "S", "S"),
    "magnesium_sulphate_16": Fertilizer("magnesium_sulphate_16", "MgSO4", "MgSO4", "Mg", "Mg"),
    "borax_11": Fertilizer("borax_11", "Borax", "B", "B", "B"),
    "ammonium_molybdate_54": Fertilizer("ammonium_molybdate_54", "Mo", "Mo", "Mo", "Mo"),
    "humic_acid_80": Fertilizer("humic_acid_80", "Humic Acid", "Organic", "Organic", "organic"),
}

ALL_LABELS = list(FERTILIZER_CATALOG.keys()) + [NO_FERTILIZER_CLASS, NUTRIENT_EXCESS_CLASS]

CROP_NUTRIENTS: Dict[str, CropNutrientProfile] = {
    "wheat": CropNutrientProfile((55, 80), (18, 30), (12, 24)),
    "barley": CropNutrientProfile((28, 48), (10, 22), (22, 38)),
    "rice": CropNutrientProfile((80, 105), (16, 28), (38, 58)),
    "maize": CropNutrientProfile((90, 115), (22, 34), (26, 42)),
    "cotton": CropNutrientProfile((60, 85), (18, 30), (60, 80)),
    "sugar_beet": CropNutrientProfile((38, 58), (25, 36), (30, 50)),
    "faba_bean": CropNutrientProfile((16, 32), (23, 35), (28, 46)),
    "lentil": CropNutrientProfile((12, 24), (14, 26), (16, 32)),
    "berseem": CropNutrientProfile((14, 28), (14, 26), (10, 22)),
    "tomato_winter": CropNutrientProfile((68, 92), (28, 42), (82, 110)),
    "tomato_summer": CropNutrientProfile((78, 102), (30, 44), (94, 122)),
    "potato": CropNutrientProfile((70, 95), (36, 50), (110, 140)),
    "onion": CropNutrientProfile((50, 70), (16, 28), (42, 64)),
    "garlic": CropNutrientProfile((40, 60), (14, 26), (56, 78)),
    "eggplant": CropNutrientProfile((65, 90), (16, 28), (74, 100)),
    "pepper": CropNutrientProfile((55, 78), (22, 34), (50, 74)),
    "cabbage": CropNutrientProfile((48, 68), (19, 31), (54, 78)),
    "cucumber": CropNutrientProfile((48, 68), (14, 26), (78, 106)),
    "watermelon": CropNutrientProfile((30, 50), (12, 24), (64, 92)),
    "citrus": CropNutrientProfile((74, 100), (18, 30), (76, 104)),
    "mango": CropNutrientProfile((58, 82), (16, 28), (62, 90)),
    "banana": CropNutrientProfile((96, 120), (28, 40), (132, 165)),
    "grapes": CropNutrientProfile((50, 74), (25, 37), (78, 106)),
    "date_palm": CropNutrientProfile((24, 44), (7, 17), (42, 66)),
    "olive": CropNutrientProfile((20, 36), (9, 21), (36, 60)),
    "pomegranate": CropNutrientProfile((32, 52), (14, 26), (54, 80)),
    "mint": CropNutrientProfile((76, 100), (24, 36), (54, 78)),
    "basil": CropNutrientProfile((44, 68), (16, 28), (40, 64)),
    "coriander": CropNutrientProfile((26, 46), (12, 24), (22, 42)),
    "cumin": CropNutrientProfile((22, 42), (18, 30), (18, 38)),
}

CROPS: Dict[str, CropSpec] = {
    "wheat": CropSpec(
        "winter", 
        ["clayey_delta", "loamy_clay", "alluvial"], 
        ["north_delta", "south_delta", "middle_egypt", "upper_egypt"], 
        (10, 24), (40, 65), (7.5, 8.4), 
        False, False, True, False, False, False, False
    ),
    "barley": CropSpec(
        "winter", 
        ["sandy", "calcareous", "reclaimed", "loamy_clay"], 
        ["north_coast", "west_delta", "sinai_north", "new_lands"], 
        (10, 22), (35, 62), (7.4, 8.5), 
        False, False, False, False, False, False, False
    ),
    "rice": CropSpec(
        "summer", ["clayey_delta", "alluvial"], ["north_delta", "south_delta"], 
        (24, 36), (65, 80), (7.2, 8.2), False, False, True, False, False, False, False
    ),
    "maize": CropSpec(
        "summer", ["clayey_delta", "loamy_clay", "alluvial"], 
        ["north_delta", "south_delta", "middle_egypt", "upper_egypt"], 
        (22, 37), (45, 70), (7.2, 8.3), False, False, True, False, False, False, False
    ),
    "cotton": CropSpec(
        "summer", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt"], 
        (24, 38), (45, 68), (7.4, 8.5), False, False, False, True, False, False, True
    ),
    "sugar_beet": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "sandy", "calcareous"], ["north_delta", "south_delta", "west_delta"], 
        (10, 22), (45, 70), (7.4, 8.5), False, False, False, True, False, False, True
    ),
    "faba_bean": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt"], 
        (10, 22), (45, 68), (7.3, 8.3), False, False, False, False, False, True, False
    ),
    "lentil": CropSpec(
        "winter", ["sandy", "calcareous", "reclaimed", "loamy_clay"], 
        ["west_delta", "sinai_north", "new_lands", "middle_egypt"], 
        (10, 24), (35, 60), (7.4, 8.5), False, False, False, False, False, True, False
    ),
    "berseem": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt"], 
        (10, 24), (45, 72), (7.3, 8.3), False, False, False, False, False, True, False
    ),
    "tomato_winter": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "sandy", "alluvial"], 
        ["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt"], 
        (12, 25), (50, 75), (7.2, 8.3), True, True, False, False, True, False, False
    ),
    "tomato_summer": CropSpec(
        "summer", ["clayey_delta", "loamy_clay", "sandy", "alluvial"], 
        ["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt", "upper_egypt"], 
        (20, 35), (50, 75), (7.2, 8.3), True, True, False, False, True, False, False
    ),
    "potato": CropSpec(
        "winter", ["loamy_clay", "sandy", "alluvial"], 
        ["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt"], 
        (10, 24), (50, 75), (7.2, 8.3), True, False, False, False, True, False, False
    ),
    "onion": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt", "upper_egypt"], 
        (10, 28), (35, 68), (7.4, 8.5), True, False, False, False, False, False, True
    ),
    "garlic": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt", "upper_egypt"], 
        (10, 26), (40, 68), (7.4, 8.5), True, False, False, False, False, False, True
    ),
    "eggplant": CropSpec(
        "summer", ["clayey_delta", "loamy_clay", "alluvial", "sandy"], 
        ["north_delta", "south_delta", "east_delta", "middle_egypt", "upper_egypt"], 
        (24, 37), (48, 72), (7.2, 8.3), True, True, False, False, False, False, False
    ),
    "pepper": CropSpec(
        "summer", ["clayey_delta", "loamy_clay", "alluvial", "sandy"], 
        ["north_delta", "south_delta", "east_delta", "middle_egypt", "upper_egypt"], 
        (20, 32), (52, 76), (7.2, 8.2), True, True, False, False, False, False, False
    ),
    "cabbage": CropSpec(
        "winter", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt"], 
        (10, 22), (50, 75), (7.2, 8.3), False, False, False, True, False, False, False
    ),
    "cucumber": CropSpec(
        "summer", ["clayey_delta", "loamy_clay", "sandy", "alluvial"], 
        ["north_delta", "south_delta", "east_delta", "west_delta", "middle_egypt"], 
        (18, 32), (58, 80), (7.2, 8.3), True, True, False, False, True, False, False
    ),
    "watermelon": CropSpec(
        "summer", ["sandy", "calcareous", "reclaimed"], 
        ["east_delta", "west_delta", "upper_egypt", "new_lands", "sinai_north"], 
        (24, 39), (35, 62), (7.4, 8.5), True, False, False, False, True, False, False
    ),
    "citrus": CropSpec(
        "permanent", ["loamy_clay", "sandy", "alluvial", "reclaimed"], 
        ["east_delta", "west_delta", "middle_egypt", "upper_egypt", "new_lands"], 
        (12, 38), (45, 75), (7.2, 8.3), True, True, True, False, True, False, True
    ),
    "mango": CropSpec(
        "permanent", ["sandy", "loamy_clay", "reclaimed"], 
        ["east_delta", "middle_egypt", "upper_egypt", "aswan", "new_lands"], 
        (15, 40), (40, 75), (7.4, 8.5), True, True, False, False, False, False, True
    ),
    "banana": CropSpec(
        "permanent", ["clayey_delta", "loamy_clay", "alluvial"], ["south_delta", "middle_egypt", "upper_egypt"], 
        (20, 35), (60, 80), (7.2, 8.0), True, True, True, False, True, False, False
    ),
    "grapes": CropSpec(
        "permanent", ["sandy", "calcareous", "reclaimed", "loamy_clay"], 
        ["west_delta", "middle_egypt", "upper_egypt", "sinai_north", "new_lands"], 
        (12, 38), (35, 65), (7.4, 8.5), True, False, False, False, False, False, True
    ),
    "date_palm": CropSpec(
        "permanent", ["sandy", "calcareous", "reclaimed"], ["upper_egypt", "aswan", "new_lands"], 
        (18, 42), (20, 50), (7.4, 8.5), False, False, True, False, False, False, True
    ),
    "olive": CropSpec(
        "permanent", ["sandy", "calcareous", "reclaimed"], ["north_coast", "sinai_north", "west_delta", "new_lands"], 
        (10, 38), (30, 62), (7.4, 8.5), False, False, False, False, True, False, True
    ),
    "pomegranate": CropSpec(
        "permanent", ["sandy", "calcareous", "reclaimed", "loamy_clay"], 
        ["middle_egypt", "upper_egypt", "new_lands", "west_delta"], 
        (14, 40), (30, 65), (7.4, 8.5), True, True, False, True, False, False, False
    ),
    "mint": CropSpec(
        "permanent", ["clayey_delta", "loamy_clay", "alluvial"], ["north_delta", "south_delta", "middle_egypt"], 
        (15, 32), (55, 80), (7.2, 8.3), True, False, False, False, False, False, True
    ),
    "basil": CropSpec(
        "summer", ["loamy_clay", "alluvial", "sandy"], 
        ["north_delta", "south_delta", "east_delta", "middle_egypt", "upper_egypt"], 
        (18, 33), (45, 75), (7.2, 8.3), True, False, False, False, False, False, False
    ),
    "coriander": CropSpec(
        "winter", ["loamy_clay", "alluvial", "sandy"], ["north_delta", "south_delta", "middle_egypt", "west_delta"], 
        (10, 25), (40, 70), (7.4, 8.5), True, False, False, False, False, False, False
    ),
    "cumin": CropSpec(
        "winter", ["loamy_clay", "alluvial", "sandy", "calcareous"], 
        ["west_delta", "middle_egypt", "upper_egypt", "new_lands"], 
        (10, 25), (35, 60), (7.4, 8.5), True, False, False, False, False, False, False
    ),
}

REGIONS = {
    "north_coast": {
        "season_temp": {"winter": (10, 21), "summer": (21, 31), "permanent": (10, 31)}, 
        "humidity_range": (60, 80), 
        "soil_types": ["calcareous", "sandy"]
    },
    "north_delta": {
        "season_temp": {"winter": (10, 22), "summer": (20, 33), "permanent": (10, 33)}, 
        "humidity_range": (55, 80), 
        "soil_types": ["clayey_delta", "alluvial"]
    },
    "south_delta": {
        "season_temp": {"winter": (10, 24), "summer": (21, 35), "permanent": (10, 35)}, 
        "humidity_range": (45, 65), 
        "soil_types": ["clayey_delta", "loamy_clay", "alluvial"]
    },
    "east_delta": {
        "season_temp": {"winter": (10, 23), "summer": (20, 34), "permanent": (10, 34)}, 
        "humidity_range": (50, 70), 
        "soil_types": ["sandy", "clayey_delta", "alluvial"]
    },
    "west_delta": {
        "season_temp": {"winter": (10, 23), "summer": (21, 34), "permanent": (10, 34)}, 
        "humidity_range": (50, 70), 
        "soil_types": ["calcareous", "loamy_clay", "reclaimed"]
    },
    "middle_egypt": {
        "season_temp": {"winter": (10, 26), "summer": (20, 37), "permanent": (10, 37)}, 
        "humidity_range": (35, 60), 
        "soil_types": ["loamy_clay", "alluvial", "reclaimed"]
    },
    "upper_egypt": {
        "season_temp": {"winter": (10, 28), "summer": (22, 41), "permanent": (10, 41)}, 
        "humidity_range": (25, 50), 
        "soil_types": ["loamy_clay", "alluvial", "sandy"]
    },
    "aswan": {
        "season_temp": {"winter": (10, 29), "summer": (24, 42), "permanent": (10, 42)}, 
        "humidity_range": (20, 45), 
        "soil_types": ["sandy", "reclaimed", "alluvial"]
    },
    "sinai_north": {
        "season_temp": {"winter": (10, 22), "summer": (20, 33), "permanent": (10, 33)}, 
        "humidity_range": (50, 70), 
        "soil_types": ["sandy", "calcareous", "reclaimed"]
    },
    "new_lands": {
        "season_temp": {"winter": (10, 27), "summer": (21, 40), "permanent": (10, 40)}, 
        "humidity_range": (20, 45), 
        "soil_types": ["sandy", "calcareous", "reclaimed"]
    },
}

SOIL_PH = {
    "clayey_delta": (7.8, 8.5), "loamy_clay": (7.6, 8.1), 
    "alluvial": (7.5, 8.2), "sandy": (7.2, 7.9), 
    "calcareous": (7.6, 8.3), "reclaimed": (7.4, 8.4)
}

def clip_g(col, val):
    return float(np.clip(val, GLOBAL_LIMITS[col][0], GLOBAL_LIMITS[col][1]))

def bnorm(mean, sd, lo, hi):
    return float(np.clip(rng.normal(mean, sd), lo, hi))

def choose_region(spec):
    return str(rng.choice(spec.regions))

def choose_soil(spec, region):
    valid = [s for s in spec.soils if s in REGIONS[region]["soil_types"]]
    return str(rng.choice(valid)) if valid else str(rng.choice(spec.soils))

def gen_temp(spec, region, season):
    r_lo, r_hi = REGIONS[region]["season_temp"][season]
    c_lo, c_hi = spec.temp_range_c
    lo, hi = max(r_lo, c_lo), min(r_hi, c_hi)
    if lo > hi:
        lo, hi = c_lo, c_hi
    return clip_g("temperature", bnorm((lo + hi) / 2, 2.5, lo, hi))

def gen_humidity(spec, region, temp):
    r_lo, r_hi = REGIONS[region]["humidity_range"]
    c_lo, c_hi = spec.humidity_range_pct
    lo, hi = max(r_lo, c_lo), min(r_hi, c_hi)
    if lo > hi:
        lo, hi = c_lo, c_hi
    mean = (lo + hi) / 2
    if temp > 32:
        mean -= rng.uniform(2, 5)
    elif temp < 18:
        mean += rng.uniform(1, 3)
    return clip_g("humidity", bnorm(mean, 3.5, lo, hi))

def gen_ph(soil, spec):
    s_lo, s_hi = SOIL_PH[soil]
    lo, hi = max(s_lo, spec.ph_range[0], 7.0), min(s_hi, spec.ph_range[1], 8.5)
    if lo > hi:
        lo, hi = 7.0, 8.5
    if rng.random() < 0.25 and hi >= 8.2:
        return clip_g("ph", rng.uniform(8.2, hi))
    return clip_g("ph", bnorm((lo + hi) / 2, 0.15, lo, hi))

def gen_soil_npk(crop_name):
    prof = CROP_NUTRIENTS[crop_name]
    s = rng.random()

    if s < 0.15:
        N, P, K = (
            rng.uniform(prof.optimal_N[0]*0.95, prof.optimal_N[1]*1.05), 
            rng.uniform(prof.optimal_P[0]*0.95, prof.optimal_P[1]*1.05), 
            rng.uniform(prof.optimal_K[0]*0.95, prof.optimal_K[1]*1.05)
        )
    elif s < 0.30:
        N, P, K = (
            rng.uniform(prof.optimal_N[1]*1.20, prof.optimal_N[1]*1.60), 
            rng.uniform(prof.optimal_P[1]*1.20, prof.optimal_P[1]*1.60), 
            rng.uniform(prof.optimal_K[1]*1.20, prof.optimal_K[1]*1.60)
        )
    elif s < 0.40:
        N, P, K = (
            rng.uniform(prof.optimal_N[0]*0.20, prof.optimal_N[0]*0.50), 
            rng.uniform(prof.optimal_P[0]*0.20, prof.optimal_P[0]*0.50), 
            rng.uniform(prof.optimal_K[0]*0.20, prof.optimal_K[0]*0.50)
        )
    elif s < 0.55:
        w = str(rng.choice(["N", "P", "K"])) 
        N = rng.uniform(prof.optimal_N[0]*0.95, prof.optimal_N[1]) if w != "N" else rng.uniform(prof.optimal_N[0]*0.20, prof.optimal_N[0]*0.45)
        P = rng.uniform(prof.optimal_P[0]*0.95, prof.optimal_P[1]) if w != "P" else rng.uniform(prof.optimal_P[0]*0.20, prof.optimal_P[0]*0.45)
        K = rng.uniform(prof.optimal_K[0]*0.95, prof.optimal_K[1]) if w != "K" else rng.uniform(prof.optimal_K[0]*0.20, prof.optimal_K[0]*0.45)
    elif s < 0.65:
        choices = [str(x) for x in rng.choice(["N", "P", "K"], size=2, replace=False)] 
        N = rng.uniform(prof.optimal_N[0]*0.20, prof.optimal_N[0]*0.45) if "N" in choices else rng.uniform(prof.optimal_N[0]*0.95, prof.optimal_N[1])
        P = rng.uniform(prof.optimal_P[0]*0.20, prof.optimal_P[0]*0.45) if "P" in choices else rng.uniform(prof.optimal_P[0]*0.95, prof.optimal_P[1])
        K = rng.uniform(prof.optimal_K[0]*0.20, prof.optimal_K[0]*0.45) if "K" in choices else rng.uniform(prof.optimal_K[0]*0.95, prof.optimal_K[1])
    elif s < 0.80:
        w = str(rng.choice(["N", "P", "K"])) 
        N = rng.uniform(prof.optimal_N[0]*0.95, prof.optimal_N[1]) if w != "N" else rng.uniform(prof.optimal_N[0]*0.65, prof.optimal_N[0]*0.82)
        P = rng.uniform(prof.optimal_P[0]*0.95, prof.optimal_P[1]) if w != "P" else rng.uniform(prof.optimal_P[0]*0.65, prof.optimal_P[0]*0.82)
        K = rng.uniform(prof.optimal_K[0]*0.95, prof.optimal_K[1]) if w != "K" else rng.uniform(prof.optimal_K[0]*0.65, prof.optimal_K[0]*0.82)
    elif s < 0.90:
        choices = [str(x) for x in rng.choice(["N", "P", "K"], size=2, replace=False)] 
        N = rng.uniform(prof.optimal_N[0]*0.65, prof.optimal_N[0]*0.82) if "N" in choices else rng.uniform(prof.optimal_N[0]*0.95, prof.optimal_N[1])
        P = rng.uniform(prof.optimal_P[0]*0.65, prof.optimal_P[0]*0.82) if "P" in choices else rng.uniform(prof.optimal_P[0]*0.95, prof.optimal_P[1])
        K = rng.uniform(prof.optimal_K[0]*0.65, prof.optimal_K[0]*0.82) if "K" in choices else rng.uniform(prof.optimal_K[0]*0.95, prof.optimal_K[1])
    else:
        N, P, K = rng.uniform(0.0, 180.0), rng.uniform(0.0, 100.0), rng.uniform(0.0, 250.0)

    return round(clip_g("N", N), 2), round(clip_g("P", P), 2), round(clip_g("K", K), 2)

def classify_fertilizer(crop_name, N, P, K, temp, ph, soil_type, growth_stage):
    spec = CROPS[crop_name]
    prof = CROP_NUTRIENTS[crop_name]

    heavy = {
        "banana","potato","tomato_summer","tomato_winter","maize",
        "rice","citrus","mint","eggplant","cotton","mango",
        "pepper","cabbage","cucumber"
    }

    if (
        N > prof.optimal_N[1] * 1.40 or
        P > prof.optimal_P[1] * 1.40 or
        K > prof.optimal_K[1] * 1.40
    ):
        return NUTRIENT_EXCESS_CLASS

    n_def = max(0, prof.optimal_N[0] - N) / (prof.optimal_N[0] + 1)
    p_def = max(0, prof.optimal_P[0] - P) / (prof.optimal_P[0] + 1)
    k_def = max(0, prof.optimal_K[0] - K) / (prof.optimal_K[0] + 1)

    severe_n = n_def > 0.35
    severe_p = p_def > 0.35
    severe_k = k_def > 0.35
    mild_n, mild_p, mild_k = n_def > 0.15, p_def > 0.15, k_def > 0.15

    alk, high_alk = ph >= 8.0, ph >= 8.2
    sandy_rec = soil_type in ("sandy", "reclaimed")
    calcareous = soil_type == "calcareous"

    if high_alk and spec.iron_sensitive:
        return "iron_chelate_eddha_6"
    if alk and spec.zinc_sensitive and growth_stage == "vegetative":
        return "zinc_sulphate_22"
    if spec.boron_sensitive and growth_stage in ("flowering", "fruiting"):
        return "borax_11"
    if spec.mo_sensitive and alk:
        return "ammonium_molybdate_54"
    if high_alk and growth_stage in ("seedling", "vegetative") and soil_type in ("calcareous", "reclaimed"):
        return "manganese_sulphate_32"
    if spec.mg_sensitive and growth_stage in ("flowering", "fruiting") and calcareous:
        return "magnesium_sulphate_16"
    if spec.sulphur_responsive and alk and growth_stage == "seedling":
        return "agricultural_sulphur_99"

    if (
        prof.optimal_N[0] <= N <= prof.optimal_N[1] and
        prof.optimal_P[0] <= P <= prof.optimal_P[1] and
        prof.optimal_K[0] <= K <= prof.optimal_K[1] and
        growth_stage in ("vegetative", "flowering", "fruiting")
    ):
        return NO_FERTILIZER_CLASS

    multi_def = sum([mild_n, mild_p, mild_k])
    if crop_name in heavy and multi_def >= 2:
        return "npk_20_20_20"

    if severe_n or severe_p or severe_k:
        if severe_n and severe_p and severe_k:
            return "npk_20_20_20" if crop_name in heavy else "npk_19_19_19"
        if severe_n and severe_p:
            return "mono_ammonium_phosphate_12_61" if growth_stage == "seedling" else "di_ammonium_phosphate_18_46"
        if severe_n and severe_k:
            return "potassium_nitrate_13_0_46"
        if severe_p and severe_k:
            return "npk_20_20_20" if crop_name in heavy else "npk_19_19_19"
        if severe_n:
            if alk or calcareous:
                return "ammonium_sulphate_206"
            return "ammonium_nitrate_335" if temp > 35 else "urea_46"
        if severe_p:
            return "phosphoric_acid_85" if alk else "triple_super_phosphate_46"
        if severe_k:
            if spec.chloride_sensitive or sandy_rec:
                return "potassium_sulphate_48"
            return "potassium_nitrate_13_0_46" if temp > 35 else "potassium_chloride_60"

    if (mild_n and mild_p) or (mild_n and mild_k) or (mild_p and mild_k):
        return "npk_20_20_20" if crop_name in heavy else "npk_19_19_19"

    if mild_n:
        if sandy_rec:
            return "calcium_ammonium_nitrate_26"
        return "calcium_nitrate_155" if growth_stage in ("flowering", "fruiting") else "urea_46"
    if mild_p:
        return "phosphoric_acid_85" if alk else "single_super_phosphate_15"
    if mild_k:
        if spec.chloride_sensitive or sandy_rec:
            return "potassium_sulphate_48"
        return "potassium_nitrate_13_0_46"
    if growth_stage == "seedling":
        return "humic_acid_80" if sandy_rec else "npk_20_20_20"

    return NO_FERTILIZER_CLASS

def generate_sample(crop_name):
    spec = CROPS[crop_name]
    region = choose_region(spec)
    soil = choose_soil(spec, region)
    gs = str(rng.choice(GROWTH_STAGES))

    N, P, K = gen_soil_npk(crop_name)
    temp = gen_temp(spec, region, spec.season)
    hum = gen_humidity(spec, region, temp)
    ph = gen_ph(soil, spec)
    fert = classify_fertilizer(crop_name, N, P, K, temp, ph, soil, gs)

    return {
        "crop_name": crop_name, "N": N, "P": P, "K": K,
        "temperature": round(temp, 2), "humidity": round(hum, 2),
        "ph": round(ph, 2), "season": spec.season, "soil_type": soil,
        "region": region, "growth_stage": gs, "label": fert
    }

def generate_dataset(samples_per_class=1500):
    crops = list(CROPS.keys())
    rows = []
    pool_size = samples_per_class * len(ALL_LABELS) * 4

    for crop in crops:
        for _ in range(pool_size // len(crops)):
            rows.append(generate_sample(crop))

    df_pool = pd.DataFrame(rows)
    balanced_dfs = []

    for fert in ALL_LABELS:
        df_cls = df_pool[df_pool["label"] == fert]
        current_count = len(df_cls)

        if current_count >= samples_per_class:
            balanced_dfs.append(df_cls.sample(n=samples_per_class, replace=False, random_state=SEED))
        elif current_count > 0:
            oversampled = df_cls.sample(n=samples_per_class - current_count, replace=True, random_state=SEED)
            balanced_dfs.append(pd.concat([df_cls, oversampled], ignore_index=True))
        else:
            extra_rows, retries = [], 0
            while len(extra_rows) < samples_per_class:
                crop = str(rng.choice(crops))
                sample = generate_sample(crop)
                if sample["label"] == fert:
                    extra_rows.append(sample)
                retries += 1
                if retries > 100000:
                    break
            if extra_rows:
                balanced_dfs.append(pd.DataFrame(extra_rows))

    final_df = pd.concat(balanced_dfs)
    return final_df.sample(frac=1, random_state=SEED).reset_index(drop=True)

def validate_dataset(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing: 
        raise ValueError(f"Missing required columns: {missing}")

if __name__ == "__main__":
    N_SAMPLES = 1500
    
    print(f"Seed: {SEED}")
    print(f"Generating rows...")
    
    df = generate_dataset(samples_per_class=N_SAMPLES)
    validate_dataset(df)

    out_dir = "./outputs"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "egypt_fertilizer_recommendation.csv")
    df.to_csv(out_path, index=False)

    print(f"\n Dataset generated successfully: {out_path}")
    print(f"Rows: {len(df)}")
    print(f"Unique fertilizers: {df['label'].nunique()}")

    print("\nNumeric summary:")
    print(df[["N", "P", "K", "temperature", "humidity", "ph"]].describe().round(2).to_string())