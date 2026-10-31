from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def compute_customer_analytics(
    df_orders: pd.DataFrame,
    df_customers: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Computes Customer Analytics:
    - Customer segmentation & contribution
    - Repeat purchase rate
    - Average Order Value (AOV) by segment
    - Top customers by revenue
    - Order frequency breakdown
    """
    if df_orders is None or df_orders.empty:
        return {
            "segment_performance": [],
            "repeat_purchase_rate": 0.0,
            "top_customers": [],
            "frequency_distribution": []
        }

    df_active = df_orders.copy()
    if df_customers is not None and not df_customers.empty:
        cust_meta = df_customers.drop_duplicates(subset=["customer_id"])
        cols = [c for c in ["customer_id", "customer_name", "segment", "region"] if c in cust_meta.columns]
        df_active = pd.merge(df_active, cust_meta[cols], on="customer_id", how="left", suffixes=("", "_meta"))
        if "customer_name_meta" in df_active.columns and "customer_name" not in df_active.columns:
            df_active["customer_name"] = df_active["customer_name_meta"]
        if "segment_meta" in df_active.columns and "segment" not in df_active.columns:
            df_active["segment"] = df_active["segment_meta"]

    if "segment" not in df_active.columns:
        df_active["segment"] = "Standard"
    if "customer_name" not in df_active.columns:
        df_active["customer_name"] = df_active["customer_id"]

    # 1. Customer level aggregation
    cust_grp = df_active.groupby(["customer_id", "customer_name", "segment"]).agg(
        total_spent=("sales", "sum"),
        total_profit=("profit", "sum"),
        orders_count=("order_id", "nunique"),
        units_bought=("quantity", "sum")
    ).reset_index()

    total_customers = len(cust_grp)
    repeat_customers = cust_grp[cust_grp["orders_count"] > 1]
    repeat_rate = (len(repeat_customers) / total_customers * 100.0) if total_customers > 0 else 0.0

    # 2. Segment level aggregation
    seg_grp = df_active.groupby("segment").agg(
        revenue=("sales", "sum"),
        profit=("profit", "sum"),
        orders=("order_id", "nunique"),
        customers=("customer_id", "nunique")
    ).reset_index()

    total_rev = seg_grp["revenue"].sum()
    seg_grp["revenue_share"] = np.where(total_rev > 0, (seg_grp["revenue"] / total_rev) * 100.0, 0.0)
    seg_grp["profit_margin"] = np.where(seg_grp["revenue"] > 0, (seg_grp["profit"] / seg_grp["revenue"]) * 100.0, 0.0)
    seg_grp["aov"] = np.where(seg_grp["orders"] > 0, seg_grp["revenue"] / seg_grp["orders"], 0.0)

    # 3. Top customers
    top_custs = cust_grp.sort_values("total_spent", ascending=False).head(10).to_dict(orient="records")

    # 4. Purchase Frequency Distribution
    bins = [
        ("1 Order (One-Time)", cust_grp["orders_count"] == 1),
        ("2 - 3 Orders", (cust_grp["orders_count"] >= 2) & (cust_grp["orders_count"] <= 3)),
        ("4 - 6 Orders", (cust_grp["orders_count"] >= 4) & (cust_grp["orders_count"] <= 6)),
        ("7+ Orders (Loyal)", cust_grp["orders_count"] >= 7)
    ]
    freq_dist = []
    for label, mask in bins:
        count = int(mask.sum())
        freq_dist.append({
            "frequency_bracket": label,
            "customer_count": count,
            "percentage": round((count / total_customers * 100.0) if total_customers > 0 else 0.0, 1)
        })

    return {
        "segment_performance": seg_grp.sort_values("revenue", ascending=False).to_dict(orient="records"),
        "repeat_purchase_rate": round(repeat_rate, 2),
        "total_active_customers": total_customers,
        "top_customers": top_custs,
        "frequency_distribution": freq_dist
    }
