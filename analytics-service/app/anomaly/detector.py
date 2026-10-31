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
    df["order_date"] = pd.to_datetime(df["order_date"])

    # Aggregate daily metrics
    daily = df.groupby("order_date").agg(
        revenue=("sales", "sum"),
        profit=("profit", "sum"),
        orders=("order_id", "nunique"),
        avg_discount=("discount", "mean")
    ).reset_index().sort_values("order_date")

    daily["profit_margin"] = np.where(daily["revenue"] > 0, (daily["profit"] / daily["revenue"]) * 100.0, 0.0)

    # 1. Revenue Anomalies (Rolling 14-day window Z-Score)
    if len(daily) >= 14:
        daily["rev_roll_mean"] = daily["revenue"].rolling(window=14, min_periods=7).mean()
        daily["rev_roll_std"] = daily["revenue"].rolling(window=14, min_periods=7).std().replace(0, 1.0)
        daily["rev_zscore"] = (daily["revenue"] - daily["rev_roll_mean"]) / daily["rev_roll_std"]

        # High severity |Z| >= 2.5
        rev_anom = daily[daily["rev_zscore"].abs() >= 2.3]
        for _, row in rev_anom.tail(10).iterrows():
            is_drop = row["rev_zscore"] < 0
            exp_low = max(0.0, row["rev_roll_mean"] - 2.0 * row["rev_roll_std"])
            exp_high = row["rev_roll_mean"] + 2.0 * row["rev_roll_std"]
            anomalies.append({
                "metric": "Daily Revenue",
                "date_or_entity": row["order_date"].strftime("%Y-%m-%d"),
                "observed_value": round(float(row["revenue"]), 2),
                "expected_baseline": round(float(row["rev_roll_mean"]), 2),
                "expected_range": [round(float(exp_low), 2), round(float(exp_high), 2)],
                "deviation": round(float(row["rev_zscore"]), 2),
                "detection_method": "Rolling 14-Day Z-Score",
                "severity": "HIGH" if abs(row["rev_zscore"]) >= 3.0 or is_drop else "MEDIUM",
                "explanation": f"Daily revenue was ${row['revenue']:,.2f}, deviating by {row['rev_zscore']:+.1f} standard deviations from rolling expectation (${row['rev_roll_mean']:,.2f})."
            })

    # 2. Profit Margin Compression Anomalies
    margin_q1 = daily["profit_margin"].quantile(0.25)
    margin_q3 = daily["profit_margin"].quantile(0.75)
    margin_iqr = margin_q3 - margin_q1
    margin_lower_bound = margin_q1 - 1.5 * margin_iqr

    low_margin_days = daily[daily["profit_margin"] < margin_lower_bound]
    for _, row in low_margin_days.tail(6).iterrows():
        anomalies.append({
            "metric": "Profit Margin Compression",
            "date_or_entity": row["order_date"].strftime("%Y-%m-%d"),
            "observed_value": f"{round(float(row['profit_margin']), 1)}%",
            "expected_baseline": f"{round(float(daily['profit_margin'].median()), 1)}%",
            "expected_range": [f"{round(float(margin_lower_bound), 1)}%", f"{round(float(margin_q3), 1)}%"],
            "deviation": round(float(row["profit_margin"] - daily["profit_margin"].median()), 2),
            "detection_method": "Interquartile Range (IQR)",
            "severity": "HIGH" if row["profit_margin"] < 5.0 else "MEDIUM",
            "explanation": f"Profit margin collapsed to {row['profit_margin']:.1f}% on {row['order_date'].strftime('%Y-%m-%d')} due to product mix or high promo rate."
        })

    # 3. Discount Spike Anomalies
    disc_mean = daily["avg_discount"].mean()
    disc_std = daily["avg_discount"].std()
    if disc_std > 0:
        high_disc_days = daily[(daily["avg_discount"] - disc_mean) / disc_std >= 2.2]
        for _, row in high_disc_days.tail(5).iterrows():
            anomalies.append({
                "metric": "Discount Surge",
                "date_or_entity": row["order_date"].strftime("%Y-%m-%d"),
                "observed_value": f"{round(float(row['avg_discount'] * 100.0), 1)}%",
                "expected_baseline": f"{round(float(disc_mean * 100.0), 1)}%",
                "expected_range": ["0.0%", f"{round(float((disc_mean + 1.8 * disc_std) * 100.0), 1)}%"],
                "deviation": round(float((row["avg_discount"] - disc_mean) / disc_std), 2),
                "detection_method": "Z-Score",
                "severity": "MEDIUM",
                "explanation": f"Average discount jumped to {row['avg_discount'] * 100.0:.1f}%, exceeding the typical baseline of {disc_mean * 100.0:.1f}%."
            })

    # 4. Inventory Stockout Anomalies
    if df_inventory is not None and not df_inventory.empty:
        stockout_prods = df_inventory[df_inventory["stock_quantity"] <= df_inventory["reorder_level"]]
        for _, row in stockout_prods.iterrows():
            anomalies.append({
                "metric": "Critical Inventory Depletion",
                "date_or_entity": f"Product {row['product_id']}",
                "observed_value": int(row["stock_quantity"]),
                "expected_baseline": int(row["reorder_level"]),
                "expected_range": [int(row["reorder_level"]), int(row["reorder_level"] * 3)],
                "deviation": int(row["stock_quantity"] - row["reorder_level"]),
                "detection_method": "Threshold Breach (Stock <= Reorder Level)",
                "severity": "HIGH",
                "explanation": f"Stock level ({row['stock_quantity']} units) has fallen to or below the reorder point ({row['reorder_level']} units)."
            })

    # Sort by severity HIGH first
    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    return sorted(anomalies, key=lambda a: severity_order.get(a["severity"], 3))
