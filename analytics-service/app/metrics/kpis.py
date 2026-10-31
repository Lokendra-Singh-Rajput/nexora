from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np

def compute_diff(curr: float, prev: float, is_pct_metric: bool = False) -> Dict[str, Any]:
    abs_diff = curr - prev
    if prev != 0:
        if is_pct_metric:
            pct_diff = curr - prev  # Percentage point difference
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

def calculate_retail_kpis(
    df_current: pd.DataFrame,
    df_previous: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    if df_current is None or df_current.empty:
        return {
            "revenue": compute_diff(0.0, 0.0),
            "profit": compute_diff(0.0, 0.0),
            "profit_margin": compute_diff(0.0, 0.0, is_pct_metric=True),
            "total_orders": compute_diff(0.0, 0.0),
            "average_order_value": compute_diff(0.0, 0.0),
            "units_sold": compute_diff(0.0, 0.0),
            "return_rate": compute_diff(0.0, 0.0, is_pct_metric=True),
            "total_customers": compute_diff(0.0, 0.0)
        }

    cur_sales = float(df_current["sales"].sum()) if "sales" in df_current.columns else 0.0
    cur_profit = float(df_current["profit"].sum()) if "profit" in df_current.columns else 0.0
    cur_orders = int(df_current["order_id"].nunique()) if "order_id" in df_current.columns else len(df_current)
    cur_units = int(df_current["quantity"].sum()) if "quantity" in df_current.columns else 0
    cur_customers = int(df_current["customer_id"].nunique()) if "customer_id" in df_current.columns else 0
    cur_margin = (cur_profit / cur_sales * 100.0) if cur_sales != 0 else 0.0
    cur_aov = (cur_sales / cur_orders) if cur_orders > 0 else 0.0

    if "order_status" in df_current.columns:
        returned_orders = df_current[df_current["order_status"] == "Returned"]["order_id"].nunique()
        cur_return_rate = (returned_orders / cur_orders * 100.0) if cur_orders > 0 else 0.0
    else:
        cur_return_rate = 0.0

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

def calculate_banking_kpis(
    df_current: pd.DataFrame,
    df_previous: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    if df_current is None or df_current.empty:
        return {
            "transaction_value": compute_diff(0.0, 0.0),
            "transaction_volume": compute_diff(0.0, 0.0),
            "average_transaction_value": compute_diff(0.0, 0.0),
            "default_rate": compute_diff(0.0, 0.0, is_pct_metric=True),
            "fraud_rate": compute_diff(0.0, 0.0, is_pct_metric=True),
            "fraud_count": compute_diff(0.0, 0.0),
            "high_risk_volume": compute_diff(0.0, 0.0)
        }

    # Extract numerical amount
    cur_val = float(df_current["amount"].sum()) if "amount" in df_current.columns else 0.0
    cur_vol = int(len(df_current))
    cur_avg_val = (cur_val / cur_vol) if cur_vol > 0 else 0.0

    # Fraud
    if "is_fraud" in df_current.columns:
        cur_fraud_series = df_current["is_fraud"].apply(lambda x: 1 if str(x).lower() in ["true", "1", "yes"] else 0)
        cur_fraud_cnt = int(cur_fraud_series.sum())
        cur_fraud_rate = (cur_fraud_cnt / cur_vol * 100.0) if cur_vol > 0 else 0.0
    else:
        cur_fraud_cnt = 0
        cur_fraud_rate = 0.0

    # Default
    if "is_default" in df_current.columns:
        cur_default_series = df_current["is_default"].apply(lambda x: 1 if str(x).lower() in ["true", "1", "yes"] else 0)
        cur_def_cnt = int(cur_default_series.sum())
        cur_def_rate = (cur_def_cnt / cur_vol * 100.0) if cur_vol > 0 else 0.0
    else:
        cur_def_rate = 0.0

    # Risk score > 0.70
    if "risk_score" in df_current.columns:
        cur_risk_numeric = pd.to_numeric(df_current["risk_score"], errors="coerce").fillna(0.0)
        cur_high_risk = int((cur_risk_numeric >= 0.70).sum())
    else:
        cur_high_risk = 0

    # Previous period
    prev_val = 0.0
    prev_vol = 0
    prev_avg_val = 0.0
    prev_fraud_cnt = 0
    prev_fraud_rate = 0.0
    prev_def_rate = 0.0
    prev_high_risk = 0

    if df_previous is not None and not df_previous.empty:
        prev_val = float(df_previous["amount"].sum()) if "amount" in df_previous.columns else 0.0
        prev_vol = int(len(df_previous))
        prev_avg_val = (prev_val / prev_vol) if prev_vol > 0 else 0.0

        if "is_fraud" in df_previous.columns:
            prev_fraud_series = df_previous["is_fraud"].apply(lambda x: 1 if str(x).lower() in ["true", "1", "yes"] else 0)
            prev_fraud_cnt = int(prev_fraud_series.sum())
            prev_fraud_rate = (prev_fraud_cnt / prev_vol * 100.0) if prev_vol > 0 else 0.0

        if "is_default" in df_previous.columns:
            prev_def_series = df_previous["is_default"].apply(lambda x: 1 if str(x).lower() in ["true", "1", "yes"] else 0)
            prev_def_cnt = int(prev_def_series.sum())
            prev_def_rate = (prev_def_cnt / prev_vol * 100.0) if prev_vol > 0 else 0.0

        if "risk_score" in df_previous.columns:
            prev_risk_numeric = pd.to_numeric(df_previous["risk_score"], errors="coerce").fillna(0.0)
            prev_high_risk = int((prev_risk_numeric >= 0.70).sum())

    return {
        "transaction_value": compute_diff(cur_val, prev_val),
        "transaction_volume": compute_diff(float(cur_vol), float(prev_vol)),
        "average_transaction_value": compute_diff(cur_avg_val, prev_avg_val),
        "default_rate": compute_diff(cur_def_rate, prev_def_rate, is_pct_metric=True),
        "fraud_rate": compute_diff(cur_fraud_rate, prev_fraud_rate, is_pct_metric=True),
        "fraud_count": compute_diff(float(cur_fraud_cnt), float(prev_fraud_cnt)),
        "high_risk_volume": compute_diff(float(cur_high_risk), float(prev_high_risk))
    }

def calculate_manufacturing_kpis(
    df_current: pd.DataFrame,
    df_previous: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    if df_current is None or df_current.empty:
        return {
            "production_volume": compute_diff(0.0, 0.0),
            "defect_rate": compute_diff(0.0, 0.0, is_pct_metric=True),
            "production_efficiency": compute_diff(0.0, 0.0, is_pct_metric=True),
            "machine_downtime": compute_diff(0.0, 0.0),
            "defective_units": compute_diff(0.0, 0.0),
            "planned_volume": compute_diff(0.0, 0.0)
        }

    cur_prod = float(df_current["produced_quantity"].sum()) if "produced_quantity" in df_current.columns else 0.0
    cur_plan = float(df_current["planned_quantity"].sum()) if "planned_quantity" in df_current.columns else cur_prod
    cur_defects = float(df_current["defective_quantity"].sum()) if "defective_quantity" in df_current.columns else 0.0
    cur_downtime = float(df_current["downtime_minutes"].sum()) if "downtime_minutes" in df_current.columns else 0.0

    cur_defect_rate = (cur_defects / cur_prod * 100.0) if cur_prod > 0 else 0.0
    
    if "efficiency_pct" in df_current.columns:
        cur_eff = float(pd.to_numeric(df_current["efficiency_pct"], errors="coerce").dropna().mean())
    elif cur_plan > 0:
        cur_eff = (cur_prod / cur_plan) * 100.0
    else:
        cur_eff = 100.0 - cur_defect_rate

    prev_prod = 0.0
    prev_plan = 0.0
    prev_defects = 0.0
    prev_downtime = 0.0
    prev_defect_rate = 0.0
    prev_eff = 0.0

    if df_previous is not None and not df_previous.empty:
        prev_prod = float(df_previous["produced_quantity"].sum()) if "produced_quantity" in df_previous.columns else 0.0
        prev_plan = float(df_previous["planned_quantity"].sum()) if "planned_quantity" in df_previous.columns else prev_prod
        prev_defects = float(df_previous["defective_quantity"].sum()) if "defective_quantity" in df_previous.columns else 0.0
        prev_downtime = float(df_previous["downtime_minutes"].sum()) if "downtime_minutes" in df_previous.columns else 0.0
        prev_defect_rate = (prev_defects / prev_prod * 100.0) if prev_prod > 0 else 0.0

        if "efficiency_pct" in df_previous.columns:
            prev_eff = float(pd.to_numeric(df_previous["efficiency_pct"], errors="coerce").dropna().mean())
        elif prev_plan > 0:
            prev_eff = (prev_prod / prev_plan) * 100.0
        else:
            prev_eff = 100.0 - prev_defect_rate

    return {
        "production_volume": compute_diff(cur_prod, prev_prod),
        "defect_rate": compute_diff(cur_defect_rate, prev_defect_rate, is_pct_metric=True),
        "production_efficiency": compute_diff(cur_eff, prev_eff, is_pct_metric=True),
        "machine_downtime": compute_diff(cur_downtime, prev_downtime),
        "defective_units": compute_diff(cur_defects, prev_defects),
        "planned_volume": compute_diff(cur_plan, prev_plan)
    }

def calculate_kpis(
    df_current: pd.DataFrame,
    df_previous: Optional[pd.DataFrame] = None,
    industry: str = "RETAIL"
) -> Dict[str, Any]:
    """
    Intelligently routes to industry-specific KPI computation based on explicit
    industry configuration or column schema introspection.
    """
    ind_upper = (industry or "RETAIL").upper()

    if df_current is not None and not df_current.empty:
        cols = set(df_current.columns)
        if "amount" in cols and ("is_fraud" in cols or "is_default" in cols or "transaction_type" in cols or ind_upper.startswith("BANK")):
            return calculate_banking_kpis(df_current, df_previous)
        elif "produced_quantity" in cols or "batch_id" in cols or "downtime_minutes" in cols or ind_upper.startswith("MANUF"):
            return calculate_manufacturing_kpis(df_current, df_previous)

    if ind_upper.startswith("BANK"):
        return calculate_banking_kpis(df_current, df_previous)
    elif ind_upper.startswith("MANUF"):
        return calculate_manufacturing_kpis(df_current, df_previous)
    else:
        return calculate_retail_kpis(df_current, df_previous)
