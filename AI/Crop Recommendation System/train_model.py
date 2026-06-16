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
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, LabelEncoder

CSV_PATH = "./outputs/egypt_crop_recommendation.csv"
MODEL_PATH = "./outputs/egypt_crop_model.joblib"
LABEL_ENCODER_PATH = "./outputs/label_encoder.joblib"
COMPARISON_CSV = "./outputs/model_comparison.csv"
COMPARISON_PLOT = "./outputs/model_comparison.png"

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

def load_data():
    return pd.read_csv(CSV_PATH)

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

    out["season_month"] = out["season"] + "_" + out["month"].astype(str)
    out["region_soil"] = out["region"] + "_" + out["soil_type"]
    return out

def build_pipeline(model):
    numeric = [
        "N", "P", "K", "temperature", "humidity", "ph", "month",
        "N_P_ratio", "K_N_ratio", "P_K_ratio",
        "temp_humidity_interaction", "temp_ph_interaction",
        "npk_sum", "npk_balance",
    ]

    categorical = [
        "season", "soil_type", "region",
        "humidity_bucket", "temp_bucket", "ph_bucket",
        "season_month", "region_soil",
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
    print(f"\n {model_name} \n")

    pipeline = build_pipeline(model)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline.fit(X_train, y_train)

    train_preds = pipeline.predict(X_train)
    test_preds = pipeline.predict(X_test)
    train_acc = accuracy_score(y_train, train_preds)
    test_acc = accuracy_score(y_test, test_preds)
    test_f1 = f1_score(y_test, test_preds, average="macro")

    print("Train Accuracy :", round(train_acc, 4))
    print("Test Accuracy  :", round(test_acc, 4))
    print("Test F1 Macro  :", round(test_f1, 4))

    cv_scores = cross_val_score(
        pipeline, X, y, cv=5, scoring="f1_macro", n_jobs=-1
    )

    print("\nCross Validation (F1 Macro):")
    print("Scores:", np.round(cv_scores, 4))
    print("Mean :", round(cv_scores.mean(), 4))
    print("Std  :", round(cv_scores.std(), 4))

    print("\nClassification Report:")
    print(classification_report(
        y_test, test_preds,
        target_names=target_names,
        zero_division=0
    ))

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
        n_estimators=350,
          max_depth=12, 
          min_samples_split=6,
        min_samples_leaf=3,
          max_features="sqrt",
            random_state=42,
              n_jobs=-1
    )
    rf_pipeline, rf_metrics = evaluate("RandomForest", rf, X, y_encoded, le.classes_)
    all_results.append((rf_pipeline, rf_metrics))

    if HAS_XGBOOST:
        xgb = XGBClassifier(
            n_estimators=320, 
            max_depth=5, 
            learning_rate=0.04,
            subsample=0.72, 
            colsample_bytree=0.72, 
            reg_alpha=1.2,
            reg_lambda=2.5, 
            min_child_weight=3, 
            gamma=0.2,
            eval_metric="mlogloss", 
            random_state=42,
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
    plt.title("Model Comparison: Accuracy vs F1 Macro")
    plt.ylim(0.0, 1.1)
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(COMPARISON_PLOT)
    plt.close()
    
    print(" BEST MODEL SELECTED:")
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