from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.sales.sales_analytics import compute_sales_analytics

def compute_banking_analytics(df: pd.DataFrame) -> Dict[str, Any]:
    if df is None or df.empty:
        return {
            "daily_trends": [],
            "monthly_trends": [],
            "type_performance": [],
            "channel_performance": [],
            "risk_distribution": []
        }

    df_active = df.copy()
    if "transaction_date" in df_active.columns:
        df_active["txn_date_parsed"] = pd.to_datetime(df_active["transaction_date"], errors="coerce")
    else:
        df_active["txn_date_parsed"] = pd.to_datetime("today")

    df_active["amount_num"] = pd.to_numeric(df_active["amount"], errors="coerce").fillna(0.0)
    
    if "is_fraud" in df_active.columns:
        df_active["fraud_flag"] = df_active["is_fraud"].apply(lambda x: 1 if str(x).lower() in ["true", "1", "yes"] else 0)
    else:
        df_active["fraud_flag"] = 0

    if "is_default" in df_active.columns:
        df_active["default_flag"] = df_active["is_default"].apply(lambda x: 1 if str(x).lower() in ["true", "1", "yes"] else 0)
    else:
        df_active["default_flag"] = 0

    if "risk_score" in df_active.columns:
        df_active["risk_num"] = pd.to_numeric(df_active["risk_score"], errors="coerce").fillna(0.0)
    else:
        df_active["risk_num"] = 0.0

    # 1. Daily trends
    daily_grp = df_active.groupby(df_active["txn_date_parsed"].dt.strftime("%Y-%m-%d")).agg(
        transaction_value=("amount_num", "sum"),
        transaction_volume=("amount_num", "count"),
        fraud_count=("fraud_flag", "sum"),
        default_count=("default_flag", "sum"),
        avg_risk=("risk_num", "mean")
    ).reset_index().rename(columns={"txn_date_parsed": "date"})

    daily_grp["average_value"] = np.where(daily_grp["transaction_volume"] > 0, daily_grp["transaction_value"] / daily_grp["transaction_volume"], 0.0)
    daily_grp["fraud_rate"] = np.where(daily_grp["transaction_volume"] > 0, (daily_grp["fraud_count"] / daily_grp["transaction_volume"]) * 100.0, 0.0)
    daily_trends = daily_grp.sort_values("date").to_dict(orient="records")

    # 2. Monthly trends
    df_active["month_str"] = df_active["txn_date_parsed"].dt.strftime("%Y-%m")
    monthly_grp = df_active.groupby("month_str").agg(
        transaction_value=("amount_num", "sum"),
        transaction_volume=("amount_num", "count"),
        fraud_count=("fraud_flag", "sum"),
        default_count=("default_flag", "sum"),
        avg_risk=("risk_num", "mean")
    ).reset_index()

    monthly_grp["average_value"] = np.where(monthly_grp["transaction_volume"] > 0, monthly_grp["transaction_value"] / monthly_grp["transaction_volume"], 0.0)
    monthly_grp["fraud_rate"] = np.where(monthly_grp["transaction_volume"] > 0, (monthly_grp["fraud_count"] / monthly_grp["transaction_volume"]) * 100.0, 0.0)
    monthly_trends = monthly_grp.sort_values("month_str").to_dict(orient="records")

    # 3. Transaction Type Performance
    type_performance = []
    if "transaction_type" in df_active.columns:
        type_grp = df_active.groupby("transaction_type").agg(
            transaction_value=("amount_num", "sum"),
            transaction_volume=("amount_num", "count"),
            fraud_count=("fraud_flag", "sum"),
            default_count=("default_flag", "sum"),
            avg_risk=("risk_num", "mean")
        ).reset_index()
        total_val = type_grp["transaction_value"].sum()
        type_grp["value_share"] = np.where(total_val > 0, (type_grp["transaction_value"] / total_val) * 100.0, 0.0)
        type_grp["fraud_rate"] = np.where(type_grp["transaction_volume"] > 0, (type_grp["fraud_count"] / type_grp["transaction_volume"]) * 100.0, 0.0)
        type_performance = type_grp.sort_values("transaction_value", ascending=False).to_dict(orient="records")

    # 4. Channel Performance
    channel_performance = []
    if "channel" in df_active.columns:
        chan_grp = df_active.groupby("channel").agg(
            transaction_value=("amount_num", "sum"),
            transaction_volume=("amount_num", "count"),
            fraud_count=("fraud_flag", "sum"),
            avg_risk=("risk_num", "mean")
        ).reset_index()
        total_chan_val = chan_grp["transaction_value"].sum()
        chan_grp["value_share"] = np.where(total_chan_val > 0, (chan_grp["transaction_value"] / total_chan_val) * 100.0, 0.0)
        chan_grp["fraud_rate"] = np.where(chan_grp["transaction_volume"] > 0, (chan_grp["fraud_count"] / chan_grp["transaction_volume"]) * 100.0, 0.0)
        channel_performance = chan_grp.sort_values("transaction_value", ascending=False).to_dict(orient="records")

    # 5. Risk Distribution
    risk_distribution = []
    if "risk_num" in df_active.columns:
        low = (df_active["risk_num"] < 0.30).sum()
        med = ((df_active["risk_num"] >= 0.30) & (df_active["risk_num"] < 0.70)).sum()
        high = (df_active["risk_num"] >= 0.70).sum()
        total_risk = len(df_active)
        risk_distribution = [
            {"tier": "Low Risk (<0.30)", "count": int(low), "share": round(low / total_risk * 100.0, 2) if total_risk > 0 else 0.0},
            {"tier": "Medium Risk (0.30 - 0.70)", "count": int(med), "share": round(med / total_risk * 100.0, 2) if total_risk > 0 else 0.0},
            {"tier": "High Risk (>=0.70)", "count": int(high), "share": round(high / total_risk * 100.0, 2) if total_risk > 0 else 0.0}
        ]

    return {
        "daily_trends": daily_trends,
        "monthly_trends": monthly_trends,
        "type_performance": type_performance,
        "channel_performance": channel_performance,
        "risk_distribution": risk_distribution
    }

def compute_manufacturing_analytics(df: pd.DataFrame) -> Dict[str, Any]:
    if df is None or df.empty:
        return {
            "daily_trends": [],
            "monthly_trends": [],
            "work_center_performance": [],
            "shift_performance": [],
            "downtime_analysis": []
        }

    df_active = df.copy()
    if "production_date" in df_active.columns:
        df_active["prod_date_parsed"] = pd.to_datetime(df_active["production_date"], errors="coerce")
    else:
        df_active["prod_date_parsed"] = pd.to_datetime("today")

    df_active["prod_qty_num"] = pd.to_numeric(df_active.get("produced_quantity", 0), errors="coerce").fillna(0)
    df_active["plan_qty_num"] = pd.to_numeric(df_active.get("planned_quantity", 0), errors="coerce").fillna(df_active["prod_qty_num"])
    df_active["defect_num"] = pd.to_numeric(df_active.get("defective_quantity", 0), errors="coerce").fillna(0)
    df_active["downtime_num"] = pd.to_numeric(df_active.get("downtime_minutes", 0), errors="coerce").fillna(0)
    df_active["eff_num"] = pd.to_numeric(df_active.get("efficiency_pct", 0), errors="coerce").fillna(0.0)

    # 1. Daily trends
    daily_grp = df_active.groupby(df_active["prod_date_parsed"].dt.strftime("%Y-%m-%d")).agg(
        production_volume=("prod_qty_num", "sum"),
        planned_volume=("plan_qty_num", "sum"),
        defective_units=("defect_num", "sum"),
        downtime_minutes=("downtime_num", "sum"),
        avg_efficiency=("eff_num", "mean")
    ).reset_index().rename(columns={"prod_date_parsed": "date"})

    daily_grp["defect_rate"] = np.where(daily_grp["production_volume"] > 0, (daily_grp["defective_units"] / daily_grp["production_volume"]) * 100.0, 0.0)
    daily_trends = daily_grp.sort_values("date").to_dict(orient="records")

    # 2. Monthly trends
    df_active["month_str"] = df_active["prod_date_parsed"].dt.strftime("%Y-%m")
    monthly_grp = df_active.groupby("month_str").agg(
        production_volume=("prod_qty_num", "sum"),
        planned_volume=("plan_qty_num", "sum"),
        defective_units=("defect_num", "sum"),
        downtime_minutes=("downtime_num", "sum"),
        avg_efficiency=("eff_num", "mean")
    ).reset_index()
    monthly_grp["defect_rate"] = np.where(monthly_grp["production_volume"] > 0, (monthly_grp["defective_units"] / monthly_grp["production_volume"]) * 100.0, 0.0)
    monthly_trends = monthly_grp.sort_values("month_str").to_dict(orient="records")

    # 3. Work Center Performance
    work_center_performance = []
    if "work_center" in df_active.columns:
        wc_grp = df_active.groupby("work_center").agg(
            production_volume=("prod_qty_num", "sum"),
            defective_units=("defect_num", "sum"),
            downtime_minutes=("downtime_num", "sum"),
            avg_efficiency=("eff_num", "mean")
        ).reset_index()
        total_vol = wc_grp["production_volume"].sum()
        wc_grp["volume_share"] = np.where(total_vol > 0, (wc_grp["production_volume"] / total_vol) * 100.0, 0.0)
        wc_grp["defect_rate"] = np.where(wc_grp["production_volume"] > 0, (wc_grp["defective_units"] / wc_grp["production_volume"]) * 100.0, 0.0)
        work_center_performance = wc_grp.sort_values("production_volume", ascending=False).to_dict(orient="records")

    # 4. Shift Performance
    shift_performance = []
    if "shift" in df_active.columns:
        shift_grp = df_active.groupby("shift").agg(
            production_volume=("prod_qty_num", "sum"),
            defective_units=("defect_num", "sum"),
            downtime_minutes=("downtime_num", "sum"),
            avg_efficiency=("eff_num", "mean")
        ).reset_index()
        total_shift_vol = shift_grp["production_volume"].sum()
        shift_grp["volume_share"] = np.where(total_shift_vol > 0, (shift_grp["production_volume"] / total_shift_vol) * 100.0, 0.0)
        shift_grp["defect_rate"] = np.where(shift_grp["production_volume"] > 0, (shift_grp["defective_units"] / shift_grp["production_volume"]) * 100.0, 0.0)
        shift_performance = shift_grp.sort_values("production_volume", ascending=False).to_dict(orient="records")

    return {
        "daily_trends": daily_trends,
        "monthly_trends": monthly_trends,
        "work_center_performance": work_center_performance,
        "shift_performance": shift_performance
    }

def compute_adaptive_industry_analytics(
    df: pd.DataFrame,
    df_products: Optional[pd.DataFrame] = None,
    industry: str = "RETAIL"
) -> Dict[str, Any]:
    ind = (industry or "RETAIL").upper()
    if df is not None and not df.empty:
        cols = set(df.columns)
        if "amount" in cols and ("is_fraud" in cols or "is_default" in cols or "transaction_type" in cols or ind.startswith("BANK")):
            return compute_banking_analytics(df)
        elif "produced_quantity" in cols or "batch_id" in cols or "downtime_minutes" in cols or ind.startswith("MANUF"):
            return compute_manufacturing_analytics(df)

    if ind.startswith("BANK"):
        return compute_banking_analytics(df)
    elif ind.startswith("MANUF"):
        return compute_manufacturing_analytics(df)
    else:
        return compute_sales_analytics(df, df_products)
