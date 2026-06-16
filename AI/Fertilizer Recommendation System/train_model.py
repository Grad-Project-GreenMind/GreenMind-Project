import warnings
warnings.filterwarnings("ignore")

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, LabelEncoder

CSV_PATH = "./outputs/egypt_fertilizer_recommendation.csv"
MODEL_PATH = "./outputs/egypt_fertilizer_model.joblib"
LABEL_ENCODER_PATH = "./outputs/fertilizer_label_encoder.joblib"
COMPARISON_CSV = "./outputs/fertilizer_model_comparison.csv"
COMPARISON_PLOT = "./outputs/fertilizer_model_comparison.png"

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

def load_data():
    return pd.read_csv(CSV_PATH)

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

    # Domain Features
    heavy_feeders = ["banana","potato","tomato_summer","tomato_winter","maize","rice","citrus","mint","eggplant","cotton","mango","pepper","cabbage","cucumber"]
    out["is_heavy_feeder"] = out["crop_name"].apply(lambda x: 1 if x in heavy_feeders else 0)

    chloride_tolerant = ["wheat","barley","rice","maize","cotton","sugar_beet","faba_bean","lentil","berseem"]
    out["is_chloride_tolerant"] = out["crop_name"].apply(lambda x: 1 if x in chloride_tolerant else 0)

    out["is_high_alkaline"] = (out["ph"] >= 8.0).astype(int)
    out["is_high_temp"] = (out["temperature"] > 35.0).astype(int)

    # Buckets
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

def build_pipeline(model):
    numeric = [
        "N","P","K","temperature","humidity","ph",
        "N_P_ratio","K_N_ratio","P_K_ratio","N_K_ratio", "npk_sum","NPK_ratio_balance",
        "N_fraction", "P_fraction", "K_fraction",
        "is_heavy_feeder","is_chloride_tolerant","is_high_alkaline","is_high_temp"
    ]

    categorical = [
        "crop_name","season","soil_type","region","growth_stage",
        "humidity_bucket","temp_bucket","ph_bucket"
    ]

    preprocessor = ColumnTransformer([
        ("num", "passthrough", numeric),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical)
    ])

    return Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

def evaluate(model_name, model, X, y, target_names):
    print(f"\n{model_name} ")

    pipeline = build_pipeline(model)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    pipeline.fit(X_train, y_train)

    train_preds = pipeline.predict(X_train)
    test_preds = pipeline.predict(X_test)

    train_acc = accuracy_score(y_train, train_preds)
    test_acc = accuracy_score(y_test, test_preds)
    test_f1 = f1_score(y_test, test_preds, average="macro")

    print(f"Train Accuracy  : {round(train_acc, 4)}")
    print(f"Test Accuracy   : {round(test_acc, 4)}")
    print(f"Test F1 Macro   : {round(test_f1, 4)}")

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=skf, scoring="f1_macro", n_jobs=-1)

    print("\nCross Validation (F1 Macro):")
    print(f"Scores: {np.round(cv_scores, 4)}")
    print(f"Mean  : {round(cv_scores.mean(), 4)}")
    print(f"Std   : {round(cv_scores.std(), 4)}")

    print("\nClassification Report:")
    print(classification_report(y_test, test_preds, target_names=target_names, zero_division=0))

    metrics = {
        "model_name": model_name,
        "train_accuracy": float(train_acc),
        "test_accuracy": float(test_acc),
        "test_f1_macro": float(test_f1),
        "cv_f1_mean": float(cv_scores.mean()),
        "cv_f1_std": float(cv_scores.std()),
    }

    return pipeline, metrics

def main():
    os.makedirs("./outputs", exist_ok=True)

    df = load_data()
    df = add_features(df)

    X = df.drop(columns=["label"])
    y = df["label"]

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    all_results = []
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=16,
        min_samples_split=8,
        min_samples_leaf=3,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf_pipeline, rf_metrics = evaluate("RandomForest", rf, X, y_encoded, le.classes_)
    all_results.append((rf_pipeline, rf_metrics))

    if HAS_XGBOOST:
        xgb = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.75,
            colsample_bytree=0.75,
            reg_alpha=1.5,
            reg_lambda=3.0,
            min_child_weight=4,
            gamma=0.2,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1
        )
        xgb_pipeline, xgb_metrics = evaluate("XGBoost", xgb, X, y_encoded, le.classes_)
        all_results.append((xgb_pipeline, xgb_metrics))
    else:
        print("\n[X] xgboost not installed. Run: pip install xgboost")

    best_pipeline, best_metrics = max(
        all_results,
        key=lambda x: (x[1]["test_f1_macro"], x[1]["test_accuracy"])
    )

    dump(best_pipeline, MODEL_PATH)
    dump(le, LABEL_ENCODER_PATH)

    metrics_list = [res[1] for res in all_results]
    comparison_df = pd.DataFrame(metrics_list)
    comparison_df.to_csv(COMPARISON_CSV, index=False)

    plt.figure(figsize=(10, 6))
    x_axis = np.arange(len(comparison_df["model_name"]))
    width = 0.35

    plt.bar(x_axis - width/2, comparison_df["test_accuracy"], width, label='Test Accuracy', color="#662E8B")
    plt.bar(x_axis + width/2, comparison_df["test_f1_macro"], width, label='Test F1 Macro', color="#3CB35A")

    plt.xticks(x_axis, comparison_df["model_name"])
    plt.ylabel("Scores")
    plt.title("Fertilizer Model Comparison: Accuracy vs F1 Macro")
    plt.ylim(0.0, 1.1)
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(COMPARISON_PLOT)
    plt.close()

    print("\n BEST MODEL SELECTED:")
    print(f"Model         : {best_metrics['model_name']}")
    print(f"Train Accuracy: {best_metrics['train_accuracy']:.4f}")
    print(f"Test Accuracy : {best_metrics['test_accuracy']:.4f}")
    print(f"Test F1 Macro : {best_metrics['test_f1_macro']:.4f}")
    print(f"CV F1 Mean    : {best_metrics['cv_f1_mean']:.4f}")
    print(f"CV F1 Std     : {best_metrics['cv_f1_std']:.4f}")

    print(f"\n[OK] Saved best model -> {MODEL_PATH}")
    print(f"[OK] Saved label encoder -> {LABEL_ENCODER_PATH}")
    print(f"[OK] Saved comparison CSV -> {COMPARISON_CSV}")
    print(f"[OK] Saved comparison plot -> {COMPARISON_PLOT}\n")

if __name__ == "__main__":
    main()