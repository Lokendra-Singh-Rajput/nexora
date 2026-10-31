from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def run_root_cause_analysis(
    df_current: pd.DataFrame,
    df_previous: pd.DataFrame,
    target_kpi: str = "revenue"
) -> Dict[str, Any]:
    """
    Executes multi-dimensional variance decomposition on target KPI (revenue or profit).
    Decomposes variance into Volume vs AOV effects and ranks contributing dimensions (Region, Category, Product, Segment).
    """
    if df_current is None or df_current.empty or df_previous is None or df_previous.empty:
        return {
            "investigated_kpi": target_kpi,
            "status": "INSUFFICIENT_DATA",
            "message": "Both current and previous periods are required for root cause analysis."
        }

    # Aggregate base values
    cur_sales = float(df_current["sales"].sum())
    prev_sales = float(df_previous["sales"].sum())
    sales_delta = cur_sales - prev_sales
    sales_pct = ((sales_delta / prev_sales) * 100.0) if prev_sales > 0 else 0.0

    cur_profit = float(df_current["profit"].sum())
    prev_profit = float(df_previous["profit"].sum())
    profit_delta = cur_profit - prev_profit
    profit_pct = ((profit_delta / abs(prev_profit)) * 100.0) if prev_profit != 0 else 0.0

    cur_orders = int(df_current["order_id"].nunique())
    prev_orders = int(df_previous["order_id"].nunique())
    order_delta = cur_orders - prev_orders

    cur_aov = cur_sales / cur_orders if cur_orders > 0 else 0.0
    prev_aov = prev_sales / prev_orders if prev_orders > 0 else 0.0
    aov_delta = cur_aov - prev_aov

    # Variance Decomposition: Delta Revenue = Volume Effect + AOV Effect + Interaction Effect
    volume_effect = order_delta * prev_aov
    aov_effect = prev_orders * aov_delta
    interaction_effect = order_delta * aov_delta

    # Regional decomposition
    region_contributions = []
    if "region" in df_current.columns and "region" in df_previous.columns:
        cur_reg = df_current.groupby("region")["sales"].sum()
        prev_reg = df_previous.groupby("region")["sales"].sum()
        all_regions = sorted(list(set(cur_reg.index).union(set(prev_reg.index))))
        for reg in all_regions:
            c = float(cur_reg.get(reg, 0.0))
            p = float(prev_reg.get(reg, 0.0))
            diff = c - p
            pct = ((diff / p) * 100.0) if p > 0 else 0.0
            contrib = (diff / sales_delta * 100.0) if sales_delta != 0 else 0.0
            region_contributions.append({
                "dimension": "region",
                "name": reg,
                "current": round(c, 2),
                "previous": round(p, 2),
                "absolute_change": round(diff, 2),
                "percentage_change": round(pct, 2),
                "contribution_to_total_change": round(contrib, 2)
            })
        region_contributions = sorted(region_contributions, key=lambda x: x["absolute_change"])

    # Category decomposition
    category_contributions = []
    if "category" in df_current.columns and "category" in df_previous.columns:
        cur_cat = df_current.groupby("category")["sales"].sum()
        prev_cat = df_previous.groupby("category")["sales"].sum()
        for cat in sorted(list(set(cur_cat.index).union(set(prev_cat.index)))):
            c = float(cur_cat.get(cat, 0.0))
            p = float(prev_cat.get(cat, 0.0))
            diff = c - p
            pct = ((diff / p) * 100.0) if p > 0 else 0.0
            contrib = (diff / sales_delta * 100.0) if sales_delta != 0 else 0.0
            category_contributions.append({
                "dimension": "category",
                "name": cat,
                "current": round(c, 2),
                "previous": round(p, 2),
                "absolute_change": round(diff, 2),
                "percentage_change": round(pct, 2),
                "contribution_to_total_change": round(contrib, 2)
            })
        category_contributions = sorted(category_contributions, key=lambda x: x["absolute_change"])

    # Product level top decliners / growers
    product_contributions = []
    if "product_id" in df_current.columns and "product_id" in df_previous.columns:
        cur_prod = df_current.groupby(["product_id"])["sales"].sum()
        prev_prod = df_previous.groupby(["product_id"])["sales"].sum()
        for pid in sorted(list(set(cur_prod.index).union(set(prev_prod.index)))):
            c = float(cur_prod.get(pid, 0.0))
            p = float(prev_prod.get(pid, 0.0))
            diff = c - p
            product_contributions.append({
                "dimension": "product",
                "name": pid,
                "current": round(c, 2),
                "previous": round(p, 2),
                "absolute_change": round(diff, 2),
                "contribution_to_total_change": round((diff / sales_delta * 100.0) if sales_delta != 0 else 0.0, 2)
            })
        product_contributions = sorted(product_contributions, key=lambda x: x["absolute_change"])

    # Discount impact
    cur_disc = float(df_current["discount"].mean() * 100.0) if "discount" in df_current.columns else 0.0
    prev_disc = float(df_previous["discount"].mean() * 100.0) if "discount" in df_previous.columns else 0.0
    disc_delta = cur_disc - prev_disc

    # Generate evidence-based explanations
    explanations = []
    actions = []
    
    # Check primary driver
    if abs(volume_effect) > abs(aov_effect):
        explanations.append(
            f"Order volume contraction ({order_delta:+,d} orders, effect: ${volume_effect:+,.2f}) was the primary driver of revenue movement, explaining the majority of top-line variation."
        )
    else:
        explanations.append(
            f"Average Order Value change ({aov_delta:+,.2f}/order, effect: ${aov_effect:+,.2f}) outstripped order volume changes."
        )

    # Check top declining dimension
    if region_contributions:
        worst_reg = region_contributions[0]
        if worst_reg["absolute_change"] < 0:
            explanations.append(
                f"Region '{worst_reg['name']}' experienced the steepest decline (${worst_reg['absolute_change']:+,.2f}, {worst_reg['percentage_change']:+.1f}%), accounting for {worst_reg['contribution_to_total_change']:.1f}% of overall net change."
            )
            actions.append(f"Audit regional marketing spend, logistics delivery rates, and distributor stock in {worst_reg['name']}.")

    if category_contributions:
        worst_cat = category_contributions[0]
        if worst_cat["absolute_change"] < 0:
            explanations.append(
                f"Product category '{worst_cat['name']}' declined by ${worst_cat['absolute_change']:+,.2f} ({worst_cat['percentage_change']:+.1f}%), exerting drag on total performance."
            )
            actions.append(f"Review promotional pricing and inventory availability within category '{worst_cat['name']}'.")

    if disc_delta > 1.5:
        explanations.append(
            f"Average discount rate increased by {disc_delta:+.1f} percentage points (from {prev_disc:.1f}% to {cur_disc:.1f}%), eroding gross margin without sufficient elastic volume lift."
        )
        actions.append("Re-evaluate discounting guardrails and tighten coupon eligibility rules.")

    actions.append("Conduct cohort retention review to verify whether contraction stems from new customer acquisition or existing customer churn.")

    return {
        "investigated_kpi": target_kpi,
        "current_period_value": round(cur_sales if target_kpi == "revenue" else cur_profit, 2),
        "previous_period_value": round(prev_sales if target_kpi == "revenue" else prev_profit, 2),
        "absolute_change": round(sales_delta if target_kpi == "revenue" else profit_delta, 2),
        "percentage_change": round(sales_pct if target_kpi == "revenue" else profit_pct, 2),
        "variance_decomposition": {
            "order_volume_effect": round(volume_effect, 2),
            "aov_effect": round(aov_effect, 2),
            "interaction_effect": round(interaction_effect, 2)
        },
        "dimension_breakdowns": {
            "by_region": region_contributions,
            "by_category": category_contributions,
            "top_decliners_products": product_contributions[:5],
            "top_growers_products": sorted(product_contributions, key=lambda x: x["absolute_change"], reverse=True)[:5]
        },
        "potential_explanations": explanations,
        "suggested_actions": actions,
        "evidence_limitations": "Analysis is based on internal order transactions. Macroeconomic indicators, competitor moves, and unmonitored website traffic are not captured in this model."
    }
