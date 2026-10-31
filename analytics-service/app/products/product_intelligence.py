from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def compute_product_intelligence(
    df_orders: pd.DataFrame,
    df_products: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Computes Product Intelligence metrics:
    - Top Revenue & Top Profit Products
    - Lowest Margin Products
    - High-Revenue Low-Profit (Margin Traps)
    - Declining Products
    - Pareto Concentration Analysis
    """
    if df_orders is None or df_orders.empty:
        return {
            "top_revenue_products": [],
            "top_profit_products": [],
            "lowest_margin_products": [],
            "revenue_traps": [],
            "declining_products": [],
            "concentration": {"pareto_top_20_revenue_share": 0.0}
        }

    df_active = df_orders.copy()
    if df_products is not None and not df_products.empty:
        prod_meta = df_products.drop_duplicates(subset=["product_id"])
        # Merge product_name, category if missing
        cols_to_use = [c for c in ["product_id", "product_name", "category", "sub_category"] if c in prod_meta.columns]
        df_active = pd.merge(df_active, prod_meta[cols_to_use], on="product_id", how="left", suffixes=("", "_meta"))
        if "product_name_meta" in df_active.columns and "product_name" not in df_active.columns:
            df_active["product_name"] = df_active["product_name_meta"]
        if "category_meta" in df_active.columns and "category" not in df_active.columns:
            df_active["category"] = df_active["category_meta"]

    if "product_name" not in df_active.columns:
        df_active["product_name"] = df_active["product_id"]

    prod_grp = df_active.groupby(["product_id", "product_name"]).agg(
        revenue=("sales", "sum"),
        profit=("profit", "sum"),
        units=("quantity", "sum"),
        orders=("order_id", "nunique"),
        avg_discount=("discount", "mean")
    ).reset_index()

    prod_grp["profit_margin"] = np.where(prod_grp["revenue"] > 0, (prod_grp["profit"] / prod_grp["revenue"]) * 100.0, 0.0)
    total_rev = prod_grp["revenue"].sum()
    prod_grp["revenue_share"] = np.where(total_rev > 0, (prod_grp["revenue"] / total_rev) * 100.0, 0.0)

    # Sortings
    top_revenue = prod_grp.sort_values("revenue", ascending=False).head(10).to_dict(orient="records")
    top_profit = prod_grp.sort_values("profit", ascending=False).head(10).to_dict(orient="records")
    lowest_margin = prod_grp.sort_values("profit_margin", ascending=True).head(10).to_dict(orient="records")

    # Revenue Traps: In top 40% of revenue, but margin is in bottom 25%
    rev_threshold = prod_grp["revenue"].quantile(0.60)
    margin_threshold = prod_grp["profit_margin"].quantile(0.30)
    traps = prod_grp[(prod_grp["revenue"] >= rev_threshold) & (prod_grp["profit_margin"] <= margin_threshold)]
    revenue_traps = traps.sort_values("revenue", ascending=False).to_dict(orient="records")

    # Declining Products: Compare second half of time series to first half
    declining_list = []
    if "order_date" in df_active.columns:
        df_active["order_date"] = pd.to_datetime(df_active["order_date"])
        min_date = df_active["order_date"].min()
        max_date = df_active["order_date"].max()
        mid_date = min_date + (max_date - min_date) / 2

        h1 = df_active[df_active["order_date"] <= mid_date].groupby("product_id")["sales"].sum()
        h2 = df_active[df_active["order_date"] > mid_date].groupby("product_id")["sales"].sum()

        comp = pd.DataFrame({"h1_sales": h1, "h2_sales": h2}).fillna(0)
        comp["growth"] = np.where(comp["h1_sales"] > 0, ((comp["h2_sales"] - comp["h1_sales"]) / comp["h1_sales"]) * 100.0, 0.0)
        declining_ids = comp[comp["growth"] < -15.0].sort_values("growth").head(8).index.tolist()

        declining_df = prod_grp[prod_grp["product_id"].isin(declining_ids)].copy()
        declining_df = pd.merge(declining_df, comp[["growth"]], on="product_id", how="left")
        declining_list = declining_df.sort_values("growth").to_dict(orient="records")

    # Pareto 80/20 Concentration
    sorted_prods = prod_grp.sort_values("revenue", ascending=False).copy()
    sorted_prods["cum_share"] = (sorted_prods["revenue"].cumsum() / total_rev) * 100.0 if total_rev > 0 else 0.0
    top_20_count = max(1, int(len(sorted_prods) * 0.20))
    pareto_share = sorted_prods.head(top_20_count)["revenue"].sum() / total_rev * 100.0 if total_rev > 0 else 0.0

    return {
        "top_revenue_products": top_revenue,
        "top_profit_products": top_profit,
        "lowest_margin_products": lowest_margin,
        "revenue_traps": revenue_traps,
        "declining_products": declining_list,
        "concentration": {
            "total_products": len(prod_grp),
            "top_20_pct_count": top_20_count,
            "pareto_top_20_revenue_share": round(pareto_share, 2)
        }
    }
