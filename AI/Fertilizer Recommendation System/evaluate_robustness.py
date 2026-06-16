import warnings
warnings.filterwarnings("ignore")

import os
import json
import numpy as np
import pandas as pd
from joblib import load
from sklearn.metrics import accuracy_score, f1_score, classification_report
from egypt_fertilizer_generator import generate_dataset
MODEL_PATH = "./outputs/egypt_fertilizer_model.joblib"
LABEL_ENCODER_PATH = "./outputs/fertilizer_label_encoder.joblib"
BASE_DATA_PATH = "./outputs/egypt_fertilizer_recommendation.csv"
OUTPUT_DIR = "./outputs"

GLOBAL_LIMITS = {
    "N": (0.0, 120.0),
    "P": (0.0, 50.0),
    "K": (0.0, 200.0),
    "ph": (7.0, 8.5),
    "temperature": (10.0, 45.0),
    "humidity": (20.0, 80.0),
}

def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    out["N_P_ratio"] = out["N"] / (out["P"].replace(0, 1) + 1.0)
    out["K_N_ratio"] = out["K"] / (out["N"].replace(0, 1) + 1.0)
    out["P_K_ratio"] = out["P"] / (out["K"].replace(0, 1) + 1.0)
    out["N_K_ratio"] = out["N"] / (out["K"].replace(0, 1) + 1.0)

    out["npk_sum"] = out["N"] + out["P"] + out["K"]
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

    
    out["humidity_bucket"] = pd.cut(
        out["humidity"],
        bins=[0, 35, 50, 65, 80, 100],
        labels=["very_low", "low", "medium", "high", "very_high"],
        include_lowest=True
    ).astype(str)

    out["temp_bucket"] = pd.cut(
        out["temperature"],
        bins=[0, 18, 24, 30, 36, 50],
        labels=["cool", "mild", "warm", "hot", "very_hot"],
        include_lowest=True
    ).astype(str)

    out["ph_bucket"] = pd.cut(
        out["ph"],
        bins=[0, 7.4, 7.8, 8.1, 8.6],
        labels=["low_alkaline", "mild_alkaline", "alkaline", "high_alkaline"],
        include_lowest=True
    ).astype(str)

    return out

def load_artifacts():
    print(f"Loading model: {MODEL_PATH}")
    model = load(MODEL_PATH)

    print(f"Loading label encoder: {LABEL_ENCODER_PATH}")
    label_encoder = load(LABEL_ENCODER_PATH)

    return model, label_encoder

def load_base_data():
    print(f"Loading dataset: {BASE_DATA_PATH}")
    df = pd.read_csv(BASE_DATA_PATH)
    return df

def decode_predictions(preds, label_encoder):
    preds = np.asarray(preds)
    if np.issubdtype(preds.dtype, np.number):
        return label_encoder.inverse_transform(preds.astype(int))
    return preds

def evaluate_predictions(y_true, y_pred, title: str):
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average="macro")

   
    print(f"\n{title}")
    print(f"Accuracy : {acc:.4f}")
    print(f"F1 Macro : {f1:.4f}")

    return {
        "accuracy": round(float(acc), 4),
        "f1_macro": round(float(f1), 4),
    }

def new_seed_test(model, label_encoder, n_samples_per_class: int = 200):
    print("\nRunning new-seed test")
    try:
        from egypt_fertilizer_generator import generate_dataset
        df_new = generate_dataset(samples_per_class=n_samples_per_class)

        X_new = add_features(df_new.drop(columns=["label"]))
        y_new = df_new["label"]

        preds = model.predict(X_new)
        preds = decode_predictions(preds, label_encoder)

        metrics = evaluate_predictions(y_new, preds, "New-Seed Test")
        report = classification_report(y_new, preds, zero_division=0, output_dict=True)

        pd.DataFrame(report).transpose().to_csv(
            os.path.join(OUTPUT_DIR, "fertilizer_new_seed_classification_report.csv"),
            index=True
        )
        return metrics
    except ImportError:
        print("[!] تم تخطي اختبار New-Seed لعدم العثور على دالة generate_dataset.")
        return None

def add_noise(df: pd.DataFrame, random_state: int = 42):
    print("\nCreating noisy dataset")
    rng = np.random.default_rng(random_state)
    noisy = df.copy()

    noise_cfg = {
        "N": 8.0,
        "P": 4.0,
        "K": 10.0,
        "temperature": 2.0,
        "humidity": 5.0,
        "ph": 0.12,
    }

    for col, sigma in noise_cfg.items():
        if col in noisy.columns:
            noisy[col] = noisy[col] + rng.normal(0, sigma, len(noisy))

    for col, (lo, hi) in GLOBAL_LIMITS.items():
        if col in noisy.columns:
            noisy[col] = noisy[col].clip(lo, hi)

    return noisy

def noisy_test(model, label_encoder, base_df: pd.DataFrame):
    print("\nRunning noisy test")
    noisy_df = add_noise(base_df)

    X_noisy = add_features(noisy_df.drop(columns=["label"]))
    y_noisy = noisy_df["label"]

    preds = model.predict(X_noisy)
    preds = decode_predictions(preds, label_encoder)

    metrics = evaluate_predictions(y_noisy, preds, "Noisy Test")
    report = classification_report(y_noisy, preds, zero_division=0, output_dict=True)

    pd.DataFrame(report).transpose().to_csv(
        os.path.join(OUTPUT_DIR, "fertilizer_noisy_classification_report.csv"),
        index=True
    )
    return metrics

def build_ablation_variants(df: pd.DataFrame):
    variants = {
        "full_features": df.copy(),
        "drop_crop_name": df.drop(columns=["crop_name"]) if "crop_name" in df.columns else df.copy(),
        "drop_growth_stage": df.drop(columns=["growth_stage"]) if "growth_stage" in df.columns else df.copy(),
        "drop_soil_region": df.drop(columns=["soil_type", "region"], errors="ignore"),
        "numeric_only_base": df[["N", "P", "K", "temperature", "humidity", "ph", "label"]].copy(),
    }
    return variants

def add_features_if_needed(df: pd.DataFrame):
    out = df.copy()

    if "N_P_ratio" not in out.columns and {"N", "P"}.issubset(out.columns):
        out["N_P_ratio"] = out["N"] / (out["P"].replace(0, 1) + 1.0)

    if "K_N_ratio" not in out.columns and {"K", "N"}.issubset(out.columns):
        out["K_N_ratio"] = out["K"] / (out["N"].replace(0, 1) + 1.0)

    if "P_K_ratio" not in out.columns and {"P", "K"}.issubset(out.columns):
        out["P_K_ratio"] = out["P"] / (out["K"].replace(0, 1) + 1.0)

    if "N_K_ratio" not in out.columns and {"N", "K"}.issubset(out.columns):
        out["N_K_ratio"] = out["N"] / (out["K"].replace(0, 1) + 1.0)

    if "npk_sum" not in out.columns and {"N", "P", "K"}.issubset(out.columns):
        out["npk_sum"] = out["N"] + out["P"] + out["K"]

    if "NPK_ratio_balance" not in out.columns and {"N", "P", "K"}.issubset(out.columns):
        out["NPK_ratio_balance"] = (out["N"] + out["P"]) / (out["K"] + 1.0)

    if "N_fraction" not in out.columns and {"N", "npk_sum"}.issubset(out.columns):
        out["N_fraction"] = out["N"] / (out["npk_sum"].replace(0, 1) + 1.0)

    if "P_fraction" not in out.columns and {"P", "npk_sum"}.issubset(out.columns):
        out["P_fraction"] = out["P"] / (out["npk_sum"].replace(0, 1) + 1.0)

    if "K_fraction" not in out.columns and {"K", "npk_sum"}.issubset(out.columns):
        out["K_fraction"] = out["K"] / (out["npk_sum"].replace(0, 1) + 1.0)

    heavy_feeders = ["banana","potato","tomato_summer","tomato_winter","maize","rice","citrus","mint","eggplant","cotton","mango","pepper","cabbage","cucumber"]
    if "is_heavy_feeder" not in out.columns:
        out["is_heavy_feeder"] = out.get("crop_name", pd.Series(dtype=str)).apply(lambda x: 1 if x in heavy_feeders else 0)

    chloride_tolerant = ["wheat","barley","rice","maize","cotton","sugar_beet","faba_bean","lentil","berseem"]
    if "is_chloride_tolerant" not in out.columns:
        out["is_chloride_tolerant"] = out.get("crop_name", pd.Series(dtype=str)).apply(lambda x: 1 if x in chloride_tolerant else 0)

    if "is_high_alkaline" not in out.columns and "ph" in out.columns:
        out["is_high_alkaline"] = (out["ph"] >= 8.0).astype(int)

    if "is_high_temp" not in out.columns and "temperature" in out.columns:
        out["is_high_temp"] = (out["temperature"] > 35.0).astype(int)

    if "humidity_bucket" not in out.columns and "humidity" in out.columns:
        out["humidity_bucket"] = pd.cut(
            out["humidity"], bins=[0, 35, 50, 65, 80, 100],
            labels=["very_low", "low", "medium", "high", "very_high"], include_lowest=True,
        ).astype(str)

    if "temp_bucket" not in out.columns and "temperature" in out.columns:
        out["temp_bucket"] = pd.cut(
            out["temperature"], bins=[0, 18, 24, 30, 36, 50],
            labels=["cool", "mild", "warm", "hot", "very_hot"], include_lowest=True,
        ).astype(str)

    if "ph_bucket" not in out.columns and "ph" in out.columns:
        out["ph_bucket"] = pd.cut(
            out["ph"], bins=[0, 7.4, 7.8, 8.1, 8.6],
            labels=["low_alkaline", "mild_alkaline", "alkaline", "high_alkaline"], include_lowest=True,
        ).astype(str)

    return out

def align_ablation_to_model_input(X_variant: pd.DataFrame):
    needed_cols = [
        "N", "P", "K", "temperature", "humidity", "ph",
        "N_P_ratio", "K_N_ratio", "P_K_ratio", "N_K_ratio", "npk_sum", "NPK_ratio_balance",
        "N_fraction", "P_fraction", "K_fraction",
        "is_heavy_feeder", "is_chloride_tolerant", "is_high_alkaline", "is_high_temp",
        "crop_name", "season", "soil_type", "region", "growth_stage",
        "humidity_bucket", "temp_bucket", "ph_bucket"
    ]

    X = X_variant.copy()
    X = add_features_if_needed(X)

    defaults = {
        "crop_name": "missing",
        "season": "missing",
        "soil_type": "missing",
        "region": "missing",
        "growth_stage": "missing",
        "humidity_bucket": "missing",
        "temp_bucket": "missing",
        "ph_bucket": "missing",
    }

    for col in needed_cols:
        if col not in X.columns:
            if col in defaults:
                X[col] = defaults[col]
            else:
                X[col] = 0.0

    return X[needed_cols]

def ablation_test(model, label_encoder, base_df: pd.DataFrame):
    print("\nRunning ablation tests")
    variants = build_ablation_variants(base_df)

    results = []
    for name, df_variant in variants.items():
        y_true = df_variant["label"]
        X_variant = df_variant.drop(columns=["label"])
        X_ready = align_ablation_to_model_input(X_variant)

        preds = model.predict(X_ready)
        preds = decode_predictions(preds, label_encoder)

        metrics = evaluate_predictions(y_true, preds, f"Ablation Test: {name}")
        metrics["variant"] = name
        results.append(metrics)

    ablation_df = pd.DataFrame(results)
    ablation_df.to_csv(os.path.join(OUTPUT_DIR, "fertilizer_ablation_results.csv"), index=False)
    return ablation_df

def feature_importance(model):
    print("\nExtracting feature importance")
    try:
        preprocessor = model.named_steps["preprocessor"]
        classifier = model.named_steps["model"]

        if not hasattr(classifier, "feature_importances_"):
            print(" Model does not expose feature_importances_.")
            return None

        feature_names = preprocessor.get_feature_names_out()
        importances = classifier.feature_importances_

        fi = pd.DataFrame({
            "feature": feature_names,
            "importance": importances
        }).sort_values("importance", ascending=False)

        out_path = os.path.join(OUTPUT_DIR, "fertilizer_feature_importance.csv")
        fi.to_csv(out_path, index=False)

        print(fi.head(20).to_string(index=False))
        print(f"\n[OK] Saved feature importance -> {out_path}")

        import matplotlib.pyplot as plt
        top_fi = fi.head(15)  
        plt.figure(figsize=(10, 6))
        plt.barh(top_fi["feature"], top_fi["importance"], color="#3CB35A", edgecolor="#2E8B57")
        plt.gca().invert_yaxis()  
        plt.xlabel("Importance Score")
        plt.ylabel("Features")
        plt.title("Top 15 Feature Importances - Fertilizer Model")
        plt.grid(axis='x', linestyle='--', alpha=0.5)
        plt.tight_layout()
        
        plot_out_path = os.path.join(OUTPUT_DIR, "fertilizer_feature_importance.png")
        plt.savefig(plot_out_path, dpi=300)
        plt.close()
        print(f" Saved feature importance plot -> {plot_out_path}")

        return fi
    except Exception as e:
        print(f" Could not extract feature importance: {e}")
        return None

def save_summary(summary: dict):
    out_path = os.path.join(OUTPUT_DIR, "fertilizer_robustness_summary.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\n Saved summary -> {out_path}")

def main():
    ensure_output_dir()

    model, label_encoder = load_artifacts()
    base_df = load_base_data()

    X_base = add_features(base_df.drop(columns=["label"]))
    y_base = base_df["label"]

    preds_base = model.predict(X_base)
    preds_base = decode_predictions(preds_base, label_encoder)

    base_metrics = evaluate_predictions(y_base, preds_base, "Base Dataset Re-check")

    new_seed_metrics = new_seed_test(model, label_encoder, n_samples_per_class=200)
    noisy_metrics = noisy_test(model, label_encoder, base_df.copy())
    ablation_df = ablation_test(model, label_encoder, base_df.copy())
    feature_importance(model)

    summary = {
        "base_dataset": base_metrics,
        "new_seed_test": new_seed_metrics,
        "noisy_test": noisy_metrics,
        "ablation_tests": ablation_df.to_dict(orient="records"),
    }
    save_summary(summary)

    print("\nDone.")

if __name__ == "__main__":
    main()