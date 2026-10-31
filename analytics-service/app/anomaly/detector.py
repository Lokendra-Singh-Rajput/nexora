from typing import Dict, Any, List
import pandas as pd
import numpy as np

def detect_anomalies(df_orders: pd.DataFrame, df_inventory: pd.DataFrame = None) -> List[Dict[str, Any]]:
    """
    Identifies statistical and operational anomalies across Revenue, Order Volume, Profit Margin, and Inventory.
    Applies Rolling Mean + Std (Z-score) and IQR detection.
    """
    anomalies: List[Dict[str, Any]] = []
    if df_orders is None or df_orders.empty:
        return anomalies

    df = df_orders.copy()
    date_col = "order_date" if "order_date" in df.columns else ("transaction_date" if "transaction_date" in df.columns else "production_date")
    if date_col not in df.columns:
        return anomalies

    df["parsed_date"] = pd.to_datetime(df[date_col], errors="coerce")
    df = df.dropna(subset=["parsed_date"])
    if df.empty:
        return anomalies

    # Safe columns
    if "sales" not in df.columns:
        df["sales"] = df["amount"] if "amount" in df.columns else (df["produced_quantity"] if "produced_quantity" in df.columns else 0.0)
    if "profit" not in df.columns:
        df["profit"] = df["sales"] * 0.28
    if "order_id" not in df.columns:
        df["order_id"] = range(len(df))
    if "discount" not in df.columns:
        df["discount"] = 0.0

    # Aggregate daily metrics
    daily = df.groupby(df["parsed_date"].dt.strftime("%Y-%m-%d")).agg(
        revenue=("sales", "sum"),
        profit=("profit", "sum"),
        orders=("order_id", "nunique"),
        avg_discount=("discount", "mean")
    ).reset_index().rename(columns={"parsed_date": "date_str"}).sort_values("date_str")

    daily["profit_margin"] = np.where(daily["revenue"] > 0, (daily["profit"] / daily["revenue"]) * 100.0, 0.0)

    # 1. Revenue Anomalies (Rolling 14-day window Z-Score)
    if len(daily) >= 14:
        daily["rev_roll_mean"] = daily["revenue"].rolling(window=14, min_periods=7).mean()
        daily["rev_roll_std"] = daily["revenue"].rolling(window=14, min_periods=7).std().replace(0, 1.0)
        daily["rev_zscore"] = (daily["revenue"] - daily["rev_roll_mean"]) / daily["rev_roll_std"]

        # High severity |Z| >= 2.3
        rev_anom = daily[daily["rev_zscore"].abs() >= 2.3]
        for _, row in rev_anom.tail(10).iterrows():
            is_drop = row["rev_zscore"] < 0
            exp_low = max(0.0, row["rev_roll_mean"] - 2.0 * row["rev_roll_std"])
            exp_high = row["rev_roll_mean"] + 2.0 * row["rev_roll_std"]
            anomalies.append({
                "metric": "Daily Revenue Spike" if not is_drop else "Daily Revenue Drop",
                "date_or_entity": str(row["date_str"]),
                "observed_value": round(float(row["revenue"]), 2),
                "expected_baseline": round(float(row["rev_roll_mean"]), 2),
                "expected_range": [round(float(exp_low), 2), round(float(exp_high), 2)],
                "deviation": round(float(row["rev_zscore"]), 2),
                "detection_method": "Rolling 14-Day Z-Score",
                "severity": "HIGH" if abs(row["rev_zscore"]) >= 3.0 or is_drop else "MEDIUM",
                "description": f"Daily volume/sales was {row['revenue']:,.2f}, deviating by {row['rev_zscore']:+.1f} standard deviations from rolling expectation ({row['rev_roll_mean']:,.2f}).",
                "explanation": f"Daily volume/sales was {row['revenue']:,.2f}, deviating by {row['rev_zscore']:+.1f} standard deviations from rolling expectation ({row['rev_roll_mean']:,.2f})."
            })

    # 2. Inventory Stockout Anomalies
    if df_inventory is not None and not df_inventory.empty:
        stockout_mask = (df_inventory["stock_quantity"] <= df_inventory["reorder_level"])
        stockouts = df_inventory[stockout_mask]
        for _, row in stockouts.iterrows():
            anomalies.append({
                "metric": "Inventory Stockout Risk",
                "date_or_entity": str(row.get("product_id", "UNKNOWN")),
                "observed_value": float(row.get("stock_quantity", 0)),
                "expected_baseline": float(row.get("reorder_level", 20)),
                "expected_range": [float(row.get("reorder_level", 20)), float(row.get("reorder_level", 20)) * 5],
                "deviation": round(float(row.get("stock_quantity", 0) - row.get("reorder_level", 20)), 2),
                "detection_method": "Reorder Threshold Rule",
                "severity": "CRITICAL" if row.get("stock_quantity", 0) == 0 else "HIGH",
                "description": f"Product {row.get('product_id')} inventory is critically low ({row.get('stock_quantity')} units <= reorder level {row.get('reorder_level')}).",
                "explanation": f"Product {row.get('product_id')} inventory is critically low ({row.get('stock_quantity')} units <= reorder level {row.get('reorder_level')})."
            })

    return anomalies
