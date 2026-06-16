from egypt_crop_generator import generate_dataset, validate_dataset

def test_smoke():
    df = generate_dataset(100)
    assert len(df) == 100
    assert not df.empty

def test_required_columns():
    df = generate_dataset(100)
    expected = {
        "N", "P", "K", "temperature", "humidity", "ph",
        "month", "season", "soil_type", "region", "label"
    }
    assert expected.issubset(df.columns)

def test_no_rainfall_column():
    df = generate_dataset(100)
    assert "annual_rainfall_mm" not in df.columns

def test_global_ranges():
    df = generate_dataset(1000)
    assert df["N"].between(0, 120).all()
    assert df["P"].between(0, 50).all()
    assert df["K"].between(0, 200).all()
    assert df["ph"].between(7.0, 8.5).all()
    assert df["temperature"].between(10.0, 45.0).all()
    assert df["humidity"].between(20.0, 80.0).all()

def test_month_range():
    df = generate_dataset(1000)
    assert df["month"].between(1, 12).all()

def test_no_nulls():
    df = generate_dataset(1000)
    required = [
        "N", "P", "K", "temperature", "humidity", "ph",
        "month", "season", "soil_type", "region", "label"
    ]
    assert not df[required].isnull().any().any()

def test_validation_function():
    df = generate_dataset(500)
    validate_dataset(df)

def test_crop_presence():
    df = generate_dataset(5000)
    assert "olive" in df["label"].unique()
    assert "wheat" in df["label"].unique()
    assert "rice" in df["label"].unique()

if __name__ == "__main__":
    test_smoke()
    test_required_columns()
    test_no_rainfall_column()
    test_global_ranges()
    test_month_range()
    test_no_nulls()
    test_validation_function()
    test_crop_presence()
    print("All tests passed.")