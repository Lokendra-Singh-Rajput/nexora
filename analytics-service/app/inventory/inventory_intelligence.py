from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def compute_inventory_intelligence(
    df_inventory: pd.DataFrame,
    df_orders: pd.DataFrame,
    df_products: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Computes inventory health, stockout velocity, days of inventory remaining, and reorder alerts.
    """
    if df_inventory is None or df_inventory.empty:
        return {
            "summary": {"total_skus": 0, "critical_stockouts": 0, "reorder_needed": 0, "healthy_skus": 0},
            "inventory_risks": [],
            "reorder_recommendations": []
        }

    inv = df_inventory.copy()
    if df_products is not None and not df_products.empty:
        inv = pd.merge(inv, df_products[["product_id", "product_name", "category", "unit_cost", "selling_price"]], on="product_id", how="left")

    if "product_name" not in inv.columns:
        inv["product_name"] = inv["product_id"]

    # Calculate recent 30-day burn rate / sales velocity from orders
    burn_rates = {}
    if df_orders is not None and not df_orders.empty and "order_date" in df_orders.columns:
        df_orders_copy = df_orders.copy()
        df_orders_copy["order_date"] = pd.to_datetime(df_orders_copy["order_date"])
        max_date = df_orders_copy["order_date"].max()
        cutoff_date = max_date - pd.Timedelta(days=30)
        recent_orders = df_orders_copy[df_orders_copy["order_date"] >= cutoff_date]
        
        velocity = recent_orders.groupby("product_id")["quantity"].sum() / 30.0
        burn_rates = velocity.to_dict()

    inv["daily_demand"] = inv["product_id"].map(burn_rates).fillna(0.5)
    inv["daily_demand"] = np.where(inv["daily_demand"] <= 0, 0.5, inv["daily_demand"])
    
    # Days remaining = stock_quantity / daily_demand
    inv["days_remaining"] = (inv["stock_quantity"] / inv["daily_demand"]).round(1)

    # Risk categorization
    conditions = [
        (inv["stock_quantity"] <= inv["reorder_level"]) | (inv["days_remaining"] <= 7.0),
        (inv["days_remaining"] > 7.0) & (inv["days_remaining"] <= 15.0),
        (inv["days_remaining"] > 15.0)
    ]
    choices = ["CRITICAL", "WARNING", "HEALTHY"]
    inv["risk_level"] = np.select(conditions, choices, default="HEALTHY")

    # Reorder Recommendation: Target 45 days coverage
    # Recommended order = max(0, (45 * daily_demand + lead_time * daily_demand) - stock)
    lead_times = inv["supplier_lead_time"] if "supplier_lead_time" in inv.columns else 14
    inv["lead_time_days"] = lead_times
    inv["recommended_reorder_qty"] = np.maximum(
        0,
        np.ceil((45.0 + inv["lead_time_days"]) * inv["daily_demand"] - inv["stock_quantity"])
    ).astype(int)

    critical_count = int((inv["risk_level"] == "CRITICAL").sum())
    warning_count = int((inv["risk_level"] == "WARNING").sum())
    healthy_count = int((inv["risk_level"] == "HEALTHY").sum())
    reorder_needed = int((inv["stock_quantity"] <= inv["reorder_level"]).sum())

    risks = inv[inv["risk_level"].isin(["CRITICAL", "WARNING"])].sort_values("days_remaining").to_dict(orient="records")
    reorders = inv[inv["recommended_reorder_qty"] > 0].sort_values("risk_level", ascending=True).to_dict(orient="records")

    return {
        "summary": {
            "total_skus": len(inv),
            "critical_stockouts": critical_count,
            "warning_skus": warning_count,
            "reorder_needed": reorder_needed,
            "healthy_skus": healthy_count
        },
        "inventory_risks": risks,
        "reorder_recommendations": reorders
    }
