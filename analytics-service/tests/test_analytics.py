import pytest
import pandas as pd
import numpy as np

from app.metrics.kpis import calculate_kpis
from app.profiling.quality import generate_quality_report
from app.cleaning.sanitizer import auto_detect_column_mapping, clean_and_transform_dataframe
from app.root_cause.analyzer import run_root_cause_analysis
from app.forecasting.forecaster import generate_sales_forecast
from app.simulation.simulator import run_what_if_simulation
from app.anomaly.detector import detect_anomalies
from app.copilot.analyst_copilot import chat_with_copilot

@pytest.fixture
def sample_orders_df():
    data = [
        {"order_id": "ORD-1", "order_date": "2025-01-01", "customer_id": "C-1", "product_id": "P-1", "region": "North", "quantity": 2, "unit_price": 100.0, "discount": 0.1, "sales": 180.0, "profit": 60.0, "order_status": "Completed"},
        {"order_id": "ORD-2", "order_date": "2025-01-02", "customer_id": "C-2", "product_id": "P-2", "region": "South", "quantity": 1, "unit_price": 200.0, "discount": 0.0, "sales": 200.0, "profit": 80.0, "order_status": "Completed"},
        {"order_id": "ORD-3", "order_date": "2025-01-03", "customer_id": "C-1", "product_id": "P-1", "region": "North", "quantity": 3, "unit_price": 100.0, "discount": 0.0, "sales": 300.0, "profit": 120.0, "order_status": "Returned"},
    ]
    return pd.DataFrame(data)

def test_kpis_calculation(sample_orders_df):
    kpis = calculate_kpis(sample_orders_df)
    assert kpis["revenue"]["current"] == 680.0
    assert kpis["profit"]["current"] == 260.0
    assert kpis["total_orders"]["current"] == 3
    assert kpis["average_order_value"]["current"] == round(680.0 / 3, 2)
    assert kpis["profit_margin"]["current"] == round((260.0 / 680.0) * 100.0, 2)
    assert kpis["units_sold"]["current"] == 6
    assert kpis["return_rate"]["current"] == round((1 / 3) * 100.0, 2)

def test_quality_report():
    dirty_data = pd.DataFrame([
        {"order_id": "ORD-1", "quantity": 2, "sales": 100.0},
        {"order_id": "ORD-1", "quantity": 2, "sales": 100.0}, # duplicate
        {"order_id": "ORD-2", "quantity": -5, "sales": 50.0}, # negative quantity
        {"order_id": "ORD-3", "quantity": 1, "sales": None}   # missing value
    ])
    rep = generate_quality_report(dirty_data)
    assert rep["total_rows"] == 4
    assert rep["duplicate_rows"] == 1
    assert rep["quality_score"] < 100.0
    assert any(a["type"] == "negative_value" for a in rep["anomalies"])

def test_column_mapping_and_cleaning():
    raw_df = pd.DataFrame([
        {"Order Number": "ORD-99", "Transaction Date": "2025-02-15", "Item Count": "3", "Selling Price": "$45.00"}
    ])
    mapping = auto_detect_column_mapping(list(raw_df.columns))
    assert mapping["Order Number"] == "order_id"
    assert mapping["Transaction Date"] == "order_date"
    assert mapping["Item Count"] == "quantity"
    assert mapping["Selling Price"] == "unit_price"

    clean_df, audit = clean_and_transform_dataframe(raw_df, mapping)
    assert "quantity" in clean_df.columns
    assert clean_df["quantity"].iloc[0] == 3
    assert clean_df["unit_price"].iloc[0] == 45.0

def test_root_cause_variance_decomposition():
    cur = pd.DataFrame([
        {"order_id": "O1", "region": "West", "sales": 400.0, "profit": 100.0, "discount": 0.20},
        {"order_id": "O2", "region": "East", "sales": 600.0, "profit": 180.0, "discount": 0.05}
    ])
    prev = pd.DataFrame([
        {"order_id": "P1", "region": "West", "sales": 800.0, "profit": 250.0, "discount": 0.05},
        {"order_id": "P2", "region": "East", "sales": 500.0, "profit": 150.0, "discount": 0.05},
        {"order_id": "P3", "region": "North", "sales": 300.0, "profit": 90.0, "discount": 0.05}
    ])
    rc = run_root_cause_analysis(cur, prev, target_kpi="revenue")
    assert rc["current_period_value"] == 1000.0
    assert rc["previous_period_value"] == 1600.0
    assert rc["absolute_change"] == -600.0
    assert "variance_decomposition" in rc
    assert len(rc["dimension_breakdowns"]["by_region"]) > 0

def test_what_if_simulation(sample_orders_df):
    sim = run_what_if_simulation(
        sample_orders_df,
        price_change_pct=10.0, # 10% price hike
        price_elasticity=-1.2  # should contract volume by 12%
    )
    assert sim["status"] == "SUCCESS"
    assert sim["baseline"]["revenue"] == 680.0
    # Price increased, units sold contracted
    assert sim["simulated"]["units_sold"] < sim["baseline"]["units_sold"]

def test_forecasting():
    dates = pd.date_range("2025-01-01", periods=45, freq="D")
    sales = [1000.0 + (i % 7) * 150.0 + np.random.normal(0, 30) for i in range(45)]
    df = pd.DataFrame({"order_date": dates.strftime("%Y-%m-%d"), "sales": sales})
    fc = generate_sales_forecast(df, forecast_horizon_days=30)
    assert fc["status"] == "SUCCESS"
    assert len(fc["forecast_only"]) == 30
    assert fc["evaluation_metrics"]["mae"] >= 0.0

def test_anomaly_detection():
    dates = pd.date_range("2025-01-01", periods=30, freq="D")
    sales = [1000.0] * 29 + [12000.0] # Massive spike on day 30
    profits = [300.0] * 29 + [3600.0]
    df = pd.DataFrame({
        "order_date": dates.strftime("%Y-%m-%d"),
        "order_id": [f"O-{i}" for i in range(30)],
        "sales": sales,
        "profit": profits,
        "discount": [0.05] * 30
    })
    anomalies = detect_anomalies(df)
    assert len(anomalies) > 0
    assert any("Daily Revenue" in a["metric"] for a in anomalies)

def test_copilot_fallback(sample_orders_df):
    res = chat_with_copilot("Why did revenue decrease?", sample_orders_df)
    assert "response" in res
    assert "direct_answer" in res["response"]
    assert "supporting_metrics" in res["response"]
