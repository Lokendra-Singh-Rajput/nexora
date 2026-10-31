from typing import Dict, Any, List
import pandas as pd
import numpy as np

def run_what_if_simulation(
    df_orders: pd.DataFrame,
    price_change_pct: float = 0.0,
    discount_change_pct: float = 0.0,
    marketing_spend_change_pct: float = 0.0,
    volume_shock_pct: float = 0.0,
    cost_change_pct: float = 0.0,
    price_elasticity: float = -1.2,
    marketing_elasticity: float = 0.25
) -> Dict[str, Any]:
    """
    Simulates business scenario outcomes considering price elasticity of demand, marketing returns, and cost shocks.
    Avoids unrealistic assumptions: price hikes contract volume according to elasticity unless offset by marketing or organic growth.
    """
    if df_orders is None or df_orders.empty:
        return {
            "status": "ERROR",
            "message": "Orders dataset is required for baseline simulation."
        }

    # Baseline metrics
    base_revenue = float(df_orders["sales"].sum())
    base_profit = float(df_orders["profit"].sum())
    base_units = int(df_orders["quantity"].sum())
    base_orders = int(df_orders["order_id"].nunique())
    base_margin = (base_profit / base_revenue * 100.0) if base_revenue > 0 else 0.0

    # 1. Price elasticity effect on volume:
    # dQ/Q = e * dP/P
    p_pct = price_change_pct / 100.0
    price_volume_impact = price_elasticity * p_pct

    # 2. Marketing spend elasticity:
    # Lift = e_m * (dM / M) with diminishing returns
    m_pct = marketing_spend_change_pct / 100.0
    mkt_volume_impact = marketing_elasticity * np.log1p(max(-0.9, m_pct)) if m_pct >= 0 else marketing_elasticity * m_pct

    # 3. Direct volume adjustment / macro shock
    v_pct = volume_shock_pct / 100.0

    # Total net volume factor
    net_volume_multiplier = max(0.1, 1.0 + price_volume_impact + mkt_volume_impact + v_pct)

    # Price adjustment multiplier
    price_multiplier = 1.0 + p_pct

    # Discount adjustment
    d_delta = discount_change_pct / 100.0

    # Cost adjustment
    c_mult = 1.0 + (cost_change_pct / 100.0)

    # Estimate average unit economics from dataset
    # Total Cost = Base Revenue - Base Profit
    base_cogs = base_revenue - base_profit
    unit_cogs_base = base_cogs / base_units if base_units > 0 else 10.0

    # Simulated units
    sim_units = base_units * net_volume_multiplier

    # Effective price after discount
    cur_avg_disc = df_orders["discount"].mean() if "discount" in df_orders.columns else 0.05
    sim_avg_disc = np.clip(cur_avg_disc + d_delta, 0.0, 0.65)
    
    # Scale revenue
    # Revenue = Q * P * (1 - D)
    base_undiscounted = base_revenue / (1.0 - cur_avg_disc) if cur_avg_disc < 1.0 else base_revenue
    sim_revenue = base_undiscounted * net_volume_multiplier * price_multiplier * (1.0 - sim_avg_disc)

    # Scale COGS
    sim_cogs = base_cogs * net_volume_multiplier * c_mult

    # Additional marketing expense deduction if marketing spend increased
    # Estimated base marketing spend ~ 8% of revenue
    estimated_base_mkt = base_revenue * 0.08
    added_mkt_expense = estimated_base_mkt * m_pct

    sim_profit = sim_revenue - sim_cogs - added_mkt_expense
    sim_margin = (sim_profit / sim_revenue * 100.0) if sim_revenue > 0 else 0.0

    rev_diff = sim_revenue - base_revenue
    rev_pct_diff = (rev_diff / base_revenue * 100.0) if base_revenue > 0 else 0.0

    prof_diff = sim_profit - base_profit
    prof_pct_diff = (prof_diff / abs(base_profit) * 100.0) if base_profit != 0 else 0.0

    assumptions = [
        f"Price elasticity of demand is modeled at {price_elasticity:.1f}: every 1% price increase induces a {abs(price_elasticity):.1f}% volume contraction.",
        f"Marketing spend elasticity is modeled at {marketing_elasticity:.2f} with logarithmic diminishing returns.",
        f"Discount percentage adjustment shifts from {cur_avg_disc*100:.1f}% to {sim_avg_disc*100:.1f}%.",
        f"Unit COGS scales with cost change factor of {cost_change_pct:+.1f}%.",
        "Results are hypothetical scenario estimates for decision support, not deterministic forecasts."
    ]

    return {
        "status": "SUCCESS",
        "inputs": {
            "price_change_pct": price_change_pct,
            "discount_change_pct": discount_change_pct,
            "marketing_spend_change_pct": marketing_spend_change_pct,
            "volume_shock_pct": volume_shock_pct,
            "cost_change_pct": cost_change_pct
        },
        "baseline": {
            "revenue": round(base_revenue, 2),
            "profit": round(base_profit, 2),
            "profit_margin": round(base_margin, 2),
            "units_sold": base_units,
            "orders": base_orders
        },
        "simulated": {
            "revenue": round(sim_revenue, 2),
            "profit": round(sim_profit, 2),
            "profit_margin": round(sim_margin, 2),
            "units_sold": int(round(sim_units)),
            "revenue_difference": round(rev_diff, 2),
            "revenue_percent_difference": round(rev_pct_diff, 2),
            "profit_difference": round(prof_diff, 2),
            "profit_percent_difference": round(prof_pct_diff, 2),
            "margin_difference": round(sim_margin - base_margin, 2)
        },
        "scenario_comparison": [
            {"metric": "Revenue", "baseline": round(base_revenue, 2), "simulated": round(sim_revenue, 2)},
            {"metric": "Profit", "baseline": round(base_profit, 2), "simulated": round(sim_profit, 2)},
            {"metric": "COGS", "baseline": round(base_cogs, 2), "simulated": round(sim_cogs, 2)}
        ],
        "assumptions": assumptions
    }
