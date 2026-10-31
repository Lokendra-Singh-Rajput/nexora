from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np

def calculate_kpis(
    df_current: pd.DataFrame,
    df_previous: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Computes core business KPIs according to documented enterprise formulas.
    Handles empty frames, divisions by zero, and returns period-over-period comparisons.
    """
    if df_current is None or df_current.empty:
        return {
            "revenue": {"current": 0.0, "previous": 0.0, "abs_diff": 0.0, "pct_diff": 0.0, "trend": "flat"},
            "profit": {"current": 0.0, "previous": 0.0, "abs_diff": 0.0, "pct_diff": 0.0, "trend": "flat"},
            "profit_margin": {"current": 0.0, "previous": 0.0, "abs_diff": 0.0, "pct_diff": 0.0, "trend": "flat"},
            "total_orders": {"current": 0, "previous": 0, "abs_diff": 0, "pct_diff": 0.0, "trend": "flat"},
            "average_order_value": {"current": 0.0, "previous": 0.0, "abs_diff": 0.0, "pct_diff": 0.0, "trend": "flat"},
            "units_sold": {"current": 0, "previous": 0, "abs_diff": 0, "pct_diff": 0.0, "trend": "flat"},
            "return_rate": {"current": 0.0, "previous": 0.0, "abs_diff": 0.0, "pct_diff": 0.0, "trend": "flat"},
            "total_customers": {"current": 0, "previous": 0, "abs_diff": 0, "pct_diff": 0.0, "trend": "flat"}
        }

    # Current period metrics
    cur_sales = float(df_current["sales"].sum()) if "sales" in df_current.columns else 0.0
    cur_profit = float(df_current["profit"].sum()) if "profit" in df_current.columns else 0.0
    cur_orders = int(df_current["order_id"].nunique()) if "order_id" in df_current.columns else len(df_current)
    cur_units = int(df_current["quantity"].sum()) if "quantity" in df_current.columns else 0
    cur_customers = int(df_current["customer_id"].nunique()) if "customer_id" in df_current.columns else 0
    
    cur_margin = (cur_profit / cur_sales * 100.0) if cur_sales != 0 else 0.0
    cur_aov = (cur_sales / cur_orders) if cur_orders > 0 else 0.0
    
    # Return rate
    if "order_status" in df_current.columns:
        returned_orders = df_current[df_current["order_status"] == "Returned"]["order_id"].nunique()
        cur_return_rate = (returned_orders / cur_orders * 100.0) if cur_orders > 0 else 0.0
    else:
        cur_return_rate = 0.0

    # Previous period metrics
    prev_sales = 0.0
    prev_profit = 0.0
    prev_orders = 0
    prev_units = 0
    prev_customers = 0
    prev_margin = 0.0
    prev_aov = 0.0
    prev_return_rate = 0.0

    if df_previous is not None and not df_previous.empty:
        prev_sales = float(df_previous["sales"].sum()) if "sales" in df_previous.columns else 0.0
        prev_profit = float(df_previous["profit"].sum()) if "profit" in df_previous.columns else 0.0
        prev_orders = int(df_previous["order_id"].nunique()) if "order_id" in df_previous.columns else len(df_previous)
        prev_units = int(df_previous["quantity"].sum()) if "quantity" in df_previous.columns else 0
        prev_customers = int(df_previous["customer_id"].nunique()) if "customer_id" in df_previous.columns else 0
        prev_margin = (prev_profit / prev_sales * 100.0) if prev_sales != 0 else 0.0
        prev_aov = (prev_sales / prev_orders) if prev_orders > 0 else 0.0
        if "order_status" in df_previous.columns:
            prev_returned = df_previous[df_previous["order_status"] == "Returned"]["order_id"].nunique()
            prev_return_rate = (prev_returned / prev_orders * 100.0) if prev_orders > 0 else 0.0

    def compute_diff(curr: float, prev: float, is_pct_metric: bool = False):
        abs_diff = curr - prev
        if prev != 0:
            if is_pct_metric:
                pct_diff = curr - prev  # Percentage point difference for margin/rates
            else:
                pct_diff = (abs_diff / abs(prev)) * 100.0
        else:
            pct_diff = 0.0 if curr == 0 else 100.0

        if abs_diff > 0.001:
            trend = "up"
        elif abs_diff < -0.001:
            trend = "down"
        else:
            trend = "flat"
        return {
            "current": round(curr, 2),
            "previous": round(prev, 2),
            "abs_diff": round(abs_diff, 2),
            "pct_diff": round(pct_diff, 2),
            "trend": trend
        }

    return {
        "revenue": compute_diff(cur_sales, prev_sales),
        "profit": compute_diff(cur_profit, prev_profit),
        "profit_margin": compute_diff(cur_margin, prev_margin, is_pct_metric=True),
        "total_orders": compute_diff(float(cur_orders), float(prev_orders)),
        "average_order_value": compute_diff(cur_aov, prev_aov),
        "units_sold": compute_diff(float(cur_units), float(prev_units)),
        "return_rate": compute_diff(cur_return_rate, prev_return_rate, is_pct_metric=True),
        "total_customers": compute_diff(float(cur_customers), float(prev_customers))
    }
