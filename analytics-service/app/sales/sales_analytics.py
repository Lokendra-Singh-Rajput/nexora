from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def compute_sales_analytics(df: pd.DataFrame, df_products: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    """
    Computes comprehensive sales intelligence:
    - Time-series aggregation (daily, monthly)
    - Regional sales and profitability breakdown
    - Category & Subcategory breakdown
    - Discount impact analysis
    """
    if df is None or df.empty:
        return {
            "daily_trends": [],
            "monthly_trends": [],
            "regional_performance": [],
            "category_performance": [],
            "discount_analysis": {
                "avg_discount_rate": 0.0,
                "discount_tiers": []
            }
        }

    df_active = df.copy()
    if "order_date" in df_active.columns:
        df_active["order_date"] = pd.to_datetime(df_active["order_date"])

    # 1. Daily trends
    daily_grp = df_active.groupby("order_date").agg(
        revenue=("sales", "sum"),
        profit=("profit", "sum"),
        orders=("order_id", "nunique"),
        units=("quantity", "sum")
    ).reset_index()
    
    daily_grp["aov"] = np.where(daily_grp["orders"] > 0, daily_grp["revenue"] / daily_grp["orders"], 0.0)
    daily_grp["profit_margin"] = np.where(daily_grp["revenue"] > 0, (daily_grp["profit"] / daily_grp["revenue"]) * 100.0, 0.0)
    daily_grp["date"] = daily_grp["order_date"].dt.strftime("%Y-%m-%d")

    daily_trends = daily_grp.sort_values("order_date").to_dict(orient="records")

    # 2. Monthly trends
    df_active["month_str"] = df_active["order_date"].dt.strftime("%Y-%m")
    monthly_grp = df_active.groupby("month_str").agg(
        revenue=("sales", "sum"),
        profit=("profit", "sum"),
        orders=("order_id", "nunique"),
        units=("quantity", "sum")
    ).reset_index()

    monthly_grp["aov"] = np.where(monthly_grp["orders"] > 0, monthly_grp["revenue"] / monthly_grp["orders"], 0.0)
    monthly_grp["profit_margin"] = np.where(monthly_grp["revenue"] > 0, (monthly_grp["profit"] / monthly_grp["revenue"]) * 100.0, 0.0)
    monthly_trends = monthly_grp.sort_values("month_str").to_dict(orient="records")

    # 3. Regional breakdown
    regional_performance = []
    if "region" in df_active.columns:
        reg_grp = df_active.groupby("region").agg(
            revenue=("sales", "sum"),
            profit=("profit", "sum"),
            orders=("order_id", "nunique"),
            units=("quantity", "sum")
        ).reset_index()
        total_rev = reg_grp["revenue"].sum()
        reg_grp["revenue_share"] = np.where(total_rev > 0, (reg_grp["revenue"] / total_rev) * 100.0, 0.0)
        reg_grp["profit_margin"] = np.where(reg_grp["revenue"] > 0, (reg_grp["profit"] / reg_grp["revenue"]) * 100.0, 0.0)
        reg_grp["aov"] = np.where(reg_grp["orders"] > 0, reg_grp["revenue"] / reg_grp["orders"], 0.0)
        regional_performance = reg_grp.sort_values("revenue", ascending=False).to_dict(orient="records")

    # 4. Category breakdown (merge with df_products if available)
    category_performance = []
    df_merged = df_active
    if df_products is not None and not df_products.empty and "product_id" in df_active.columns and "category" not in df_active.columns:
        df_merged = pd.merge(df_active, df_products[["product_id", "category", "sub_category"]], on="product_id", how="left")

    if "category" in df_merged.columns:
        cat_grp = df_merged.groupby("category").agg(
            revenue=("sales", "sum"),
            profit=("profit", "sum"),
            orders=("order_id", "nunique"),
            units=("quantity", "sum")
        ).reset_index()
        total_cat_rev = cat_grp["revenue"].sum()
        cat_grp["revenue_share"] = np.where(total_cat_rev > 0, (cat_grp["revenue"] / total_cat_rev) * 100.0, 0.0)
        cat_grp["profit_margin"] = np.where(cat_grp["revenue"] > 0, (cat_grp["profit"] / cat_grp["revenue"]) * 100.0, 0.0)
        category_performance = cat_grp.sort_values("revenue", ascending=False).to_dict(orient="records")

    # 5. Discount analysis
    avg_discount = float(df_active["discount"].mean() * 100.0) if "discount" in df_active.columns else 0.0
    discount_tiers = []
    if "discount" in df_active.columns:
        tiers = [
            ("No Discount (0%)", df_active["discount"] == 0),
            ("Low (1% - 10%)", (df_active["discount"] > 0) & (df_active["discount"] <= 0.10)),
            ("Moderate (11% - 20%)", (df_active["discount"] > 0.10) & (df_active["discount"] <= 0.20)),
            ("Deep (> 20%)", df_active["discount"] > 0.20)
        ]
        for name, mask in tiers:
            sub = df_active[mask]
            rev = float(sub["sales"].sum())
            prof = float(sub["profit"].sum())
            cnt = int(sub["order_id"].nunique())
            margin = (prof / rev * 100.0) if rev > 0 else 0.0
            discount_tiers.append({
                "tier": name,
                "order_count": cnt,
                "revenue": round(rev, 2),
                "profit": round(prof, 2),
                "profit_margin": round(margin, 2)
            })

    return {
        "daily_trends": daily_trends,
        "monthly_trends": monthly_trends,
        "regional_performance": regional_performance,
        "category_performance": category_performance,
        "discount_analysis": {
            "avg_discount_rate": round(avg_discount, 2),
            "discount_tiers": discount_tiers
        }
    }
