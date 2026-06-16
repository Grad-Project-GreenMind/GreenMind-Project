import warnings
warnings.filterwarnings("ignore")
import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from joblib import load
from sklearn.metrics import accuracy_score, f1_score, classification_report
from egypt_crop_generator import generate_dataset
MODEL_PATH = "./outputs/egypt_crop_model.joblib"
LABEL_ENCODER_PATH = "./outputs/label_encoder.joblib"
BASE_DATA_PATH = "./outputs/egypt_crop_recommendation.csv"
OUTPUT_DIR = "./outputs"

GLOBAL_LIMITS = {
    "N": (0.0, 120.0),
    "P": (0.0, 50.0),
    "K": (0.0, 200.0),
    "ph": (7.0, 8.5),
    "temperature": (10.0, 45.0),
    "humidity": (20.0, 80.0),
    "month": (1.0, 12.0),
}
def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
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

def load_artifacts():
    print(f"Loading model: {MODEL_PATH}")
    model = load(MODEL_PATH)

    print(f"Loading label encoder: {LABEL_ENCODER_PATH}")
    label_encoder = load(LABEL_ENCODER_PATH)
    return model, label_encoder


def load_base_data():
    print(f" Loading dataset: {BASE_DATA_PATH}")
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
    print(f"{title}")
    print(f"Accuracy : {acc:.4f}")
    print(f"F1 Macro : {f1:.4f}")

    return {
        "accuracy": round(float(acc), 4),
        "f1_macro": round(float(f1), 4),
    }

def new_seed_test(model, label_encoder, n_rows: int = 4000):
    print("\n Running new-seed test")
    df_new = generate_dataset(n_rows)
    X_new = add_features(df_new.drop(columns=["label"]))
    y_new = df_new["label"]
    preds = model.predict(X_new)
    preds = decode_predictions(preds, label_encoder)
    metrics = evaluate_predictions(y_new, preds, "New-Seed Test")
    report = classification_report(y_new, preds, zero_division=0, output_dict=True)

    pd.DataFrame(report).transpose().to_csv(
        os.path.join(OUTPUT_DIR, "new_seed_classification_report.csv"),
        index=True
    )

    return metrics

def add_noise(df: pd.DataFrame, random_state: int = 42):
    print("\n Creating noisy dataset")
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
        noisy[col] = noisy[col] + rng.normal(0, sigma, len(noisy))

    for col, (lo, hi) in GLOBAL_LIMITS.items():
        if col in noisy.columns:
            noisy[col] = noisy[col].clip(lo, hi)

    noisy["month"] = noisy["month"].round().clip(1, 12).astype(int)
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
        os.path.join(OUTPUT_DIR, "noisy_classification_report.csv"),
        index=True
    )

    return metrics

def build_ablation_variants(df: pd.DataFrame):
    variants = {
        "full_features": df.copy(),
        "drop_region": df.drop(columns=["region"]),
        "drop_soil_type": df.drop(columns=["soil_type"]),
        "drop_season": df.drop(columns=["season"]),
        "drop_region_soil_season": df.drop(columns=["region", "soil_type", "season"]),
        "numeric_only_base": df[["N", "P", "K", "temperature", "humidity", "ph", "month", "label"]].copy(),
    }
    return variants

def add_features_if_needed(df: pd.DataFrame):
    out = df.copy()

    if "N_P_ratio" not in out.columns and {"N", "P"}.issubset(out.columns):
        out["N_P_ratio"] = out["N"] / (out["P"] + 1.0)

    if "K_N_ratio" not in out.columns and {"K", "N"}.issubset(out.columns):
        out["K_N_ratio"] = out["K"] / (out["N"] + 1.0)

    if "P_K_ratio" not in out.columns and {"P", "K"}.issubset(out.columns):
        out["P_K_ratio"] = out["P"] / (out["K"] + 1.0)

    if "temp_humidity_interaction" not in out.columns and {"temperature", "humidity"}.issubset(out.columns):
        out["temp_humidity_interaction"] = out["temperature"] * out["humidity"]

    if "temp_ph_interaction" not in out.columns and {"temperature", "ph"}.issubset(out.columns):
        out["temp_ph_interaction"] = out["temperature"] * out["ph"]

    if "npk_sum" not in out.columns and {"N", "P", "K"}.issubset(out.columns):
        out["npk_sum"] = out["N"] + out["P"] + out["K"]

    if "npk_balance" not in out.columns and {"N", "P", "K"}.issubset(out.columns):
        out["npk_balance"] = (out["K"] + out["P"]) / (out["N"] + 1.0)

    if "humidity_bucket" not in out.columns and "humidity" in out.columns:
        out["humidity_bucket"] = pd.cut(
            out["humidity"],
            bins=[0, 35, 50, 65, 80, 100],
            labels=["very_low", "low", "medium", "high", "very_high"],
            include_lowest=True,
        ).astype(str)

    if "temp_bucket" not in out.columns and "temperature" in out.columns:
        out["temp_bucket"] = pd.cut(
            out["temperature"],
            bins=[0, 18, 24, 30, 36, 50],
            labels=["cool", "mild", "warm", "hot", "very_hot"],
            include_lowest=True,
        ).astype(str)

    if "ph_bucket" not in out.columns and "ph" in out.columns:
        out["ph_bucket"] = pd.cut(
            out["ph"],
            bins=[0, 7.4, 7.8, 8.1, 8.6],
            labels=["low_alkaline", "mild_alkaline", "alkaline", "high_alkaline"],
            include_lowest=True,
        ).astype(str)

    if "season_month" not in out.columns:
        if "season" in out.columns and "month" in out.columns:
            out["season_month"] = out["season"].astype(str) + "_" + out["month"].astype(int).astype(str)
        else:
            out["season_month"] = "missing"

    if "region_soil" not in out.columns:
        if "region" in out.columns and "soil_type" in out.columns:
            out["region_soil"] = out["region"].astype(str) + "_" + out["soil_type"].astype(str)
        else:
            out["region_soil"] = "missing"

    return out

def align_ablation_to_model_input(X_variant: pd.DataFrame):
    needed_cols = [
        "N", "P", "K", "temperature", "humidity", "ph", "month",
        "season", "soil_type", "region",
        "N_P_ratio", "K_N_ratio", "P_K_ratio",
        "temp_humidity_interaction", "temp_ph_interaction",
        "npk_sum", "npk_balance",
        "humidity_bucket", "temp_bucket", "ph_bucket",
        "season_month", "region_soil",
    ]

    X = X_variant.copy()
    X = add_features_if_needed(X)
    defaults = {
        "season": "missing",
        "soil_type": "missing",
        "region": "missing",
        "humidity_bucket": "missing",
        "temp_bucket": "missing",
        "ph_bucket": "missing",
        "season_month": "missing",
        "region_soil": "missing",
    }
    for col in needed_cols:
        if col not in X.columns:
            if col in defaults:
                X[col] = defaults[col]
            else:
                X[col] = 0.0

    return X[needed_cols]

def ablation_test(model, label_encoder, base_df: pd.DataFrame):
    print("\n Running ablation tests")
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
    ablation_df.to_csv(os.path.join(OUTPUT_DIR, "ablation_results.csv"), index=False)
    return ablation_df

def feature_importance(model):
    print("\n Extracting feature importance")
    try:
        preprocessor = model.named_steps["preprocessor"]
        classifier = model.named_steps["model"]

        if not hasattr(classifier, "feature_importances_"):
            print("[!] Model does not expose feature_importances_.")
            return None

        feature_names = preprocessor.get_feature_names_out()
        importances = classifier.feature_importances_

        fi = pd.DataFrame({
            "feature": feature_names,
            "importance": importances
        }).sort_values("importance", ascending=False)

        out_path = os.path.join(OUTPUT_DIR, "crop_feature_importance.csv")
        fi.to_csv(out_path, index=False)

        print(fi.head(20).to_string(index=False))
        print(f"\nSaved feature importance -> {out_path}")
      
        top_fi = fi.head(15) 
        plt.figure(figsize=(10, 6))
        plt.barh(top_fi["feature"], top_fi["importance"], color="#662E8B", edgecolor="#4A154B")
        plt.gca().invert_yaxis()  
        plt.xlabel("Importance Score")
        plt.ylabel("Features")
        plt.title("Top 15 Feature Importances - Crop Recommendation Model")
        plt.grid(axis='x', linestyle='--', alpha=0.5)
        plt.tight_layout()
        
        plot_out_path = os.path.join(OUTPUT_DIR, "crop_feature_importance.png")
        plt.savefig(plot_out_path, dpi=300)
        plt.close()
        print(f" Saved crop feature importance plot -> {plot_out_path}")
        return fi

    except Exception as e:
        print(f" Could not extract feature importance: {e}")
        return None
def save_summary(summary: dict):
    out_path = os.path.join(OUTPUT_DIR, "robustness_summary.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved summary -> {out_path}")

def main():
    ensure_output_dir()
    model, label_encoder = load_artifacts()
    base_df = load_base_data()
    X_base = add_features(base_df.drop(columns=["label"]))
    y_base = base_df["label"]

    preds_base = model.predict(X_base)
    preds_base = decode_predictions(preds_base, label_encoder)
    base_metrics = evaluate_predictions(y_base, preds_base, "Base Dataset Re-check")

    new_seed_metrics = new_seed_test(model, label_encoder, n_rows=4000)
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