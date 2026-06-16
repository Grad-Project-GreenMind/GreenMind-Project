import os
import sys
import numpy as np
import pandas as pd
import importlib
import contextlib

import egypt_fertilizer_generator
importlib.reload(egypt_fertilizer_generator)
from egypt_fertilizer_generator import generate_dataset, validate_dataset, ALL_LABELS

def test_smoke():
    df = generate_dataset(samples_per_class=5)
    expected_rows = len(ALL_LABELS) * 5
    assert len(df) == expected_rows, f"Expected {expected_rows} rows, got {len(df)}"
    assert not df.empty, "Dataset is empty!"

def test_required_columns():
    df = generate_dataset(samples_per_class=5)
    expected = {
        "crop_name", "N", "P", "K", "temperature", "humidity", "ph",
        "season", "soil_type", "region", "growth_stage", "label"
    }
    assert expected.issubset(df.columns)

def test_no_rainfall_column():
    df = generate_dataset(samples_per_class=5)
    assert "annual_rainfall_mm" not in df.columns

def test_global_ranges():
    df = generate_dataset(samples_per_class=20)
    assert df["N"].between(0, 120).all()
    assert df["P"].between(0, 50).all()
    assert df["K"].between(0, 200).all()
    assert df["ph"].between(7.0, 8.5).all()
    assert df["temperature"].between(10.0, 45.0).all()
    assert df["humidity"].between(20.0, 80.0).all()

def test_growth_stage_validity():
    df = generate_dataset(samples_per_class=10)
    allowed_stages = {"seedling", "vegetative", "flowering", "fruiting"}
    unique_stages = set(df["growth_stage"].unique())
    assert unique_stages.issubset(allowed_stages), "Found invalid growth stages!"

def test_no_nulls():
    df = generate_dataset(samples_per_class=20)
    required = [
        "crop_name", "N", "P", "K", "temperature", "humidity", "ph",
        "season", "soil_type", "region", "growth_stage", "label"
    ]
    assert not df[required].isnull().any().any()

def test_fertilizer_presence():
    df = generate_dataset(samples_per_class=2)
    unique_labels = df["label"].unique()
    assert "urea_46" in unique_labels
    assert "npk_20_20_20" in unique_labels
    assert "no_fertilizer_required" in unique_labels
    assert "nutrient_excess" in unique_labels

def test_validation_function():
    df = generate_dataset(samples_per_class=10)
    try:
        validate_dataset(df)
    except Exception as e:
        assert False, f"validate_dataset raised an exception on valid data: {e}"

def test_logic_no_urea_in_heat():
    df = generate_dataset(samples_per_class=50)
    heat_urea = df[(df["label"] == "urea_46") & (df["temperature"] > 35.0)]
    assert heat_urea.empty

def test_logic_borax_stage():
    df = generate_dataset(samples_per_class=30)
    borax_df = df[df["label"] == "borax_11"]
    if not borax_df.empty:
        valid_stages = {"flowering", "fruiting"}
        used_stages = set(borax_df["growth_stage"].unique())
        assert used_stages.issubset(valid_stages)

if __name__ == "__main__":
    with open(os.devnull, 'w') as f, contextlib.redirect_stdout(f):
        test_smoke()
        test_required_columns()
        test_no_rainfall_column()
        test_global_ranges()
        test_growth_stage_validity()
        test_no_nulls()
        test_fertilizer_presence()
        test_validation_function()
        test_logic_no_urea_in_heat()
        test_logic_borax_stage()
    print("All tests passed.")