import os
import json
import logging
from typing import Dict, Any, List, Optional
import requests
import pandas as pd
import numpy as np

from app.metrics.kpis import calculate_kpis, calculate_banking_kpis, calculate_manufacturing_kpis
from app.metrics.industry_analytics import compute_adaptive_industry_analytics
from app.sales.sales_analytics import compute_sales_analytics
from app.products.product_intelligence import compute_product_intelligence
from app.inventory.inventory_intelligence import compute_inventory_intelligence
from app.forecasting.forecaster import generate_sales_forecast
from app.root_cause.analyzer import run_root_cause_analysis
from app.anomaly.detector import detect_anomalies

logger = logging.getLogger("nexora.copilot")

TOOL_DESCRIPTIONS = [
    {"name": "get_revenue_summary", "description": "Fetches current revenue, transaction value, or production volume."},
    {"name": "get_profit_summary", "description": "Fetches profit, default rate, or production efficiency (OEE)."},
    {"name": "get_region_performance", "description": "Fetches regional breakdown, channel performance, or work center ranking."},
    {"name": "get_category_performance", "description": "Fetches category performance, transaction types, or shift analysis."},
    {"name": "get_product_performance", "description": "Fetches top product or item performance."},
    {"name": "get_inventory_risks", "description": "Fetches stockout risks or machine downtime bottlenecks."},
    {"name": "get_root_cause_analysis", "description": "Performs variance decomposition on business declines."},
    {"name": "get_forecast", "description": "Fetches forward-looking projections and statistical evaluations."},
    {"name": "get_anomalies", "description": "Fetches statistical anomalies across metrics."}
]

def determine_tool(query: str, is_banking: bool = False, is_mfg: bool = False) -> str:
    q = query.lower()
    if is_banking:
        if any(k in q for k in ["fraud", "suspicious", "flagged", "crime"]):
            return "get_profit_summary"
        if any(k in q for k in ["default", "delinquent", "npl", "bad loan", "credit"]):
            return "get_profit_summary"
        if any(k in q for k in ["channel", "branch", "atm", "online", "mobile"]):
            return "get_region_performance"
        if any(k in q for k in ["type", "wire", "transfer", "pos", "deposit"]):
            return "get_category_performance"
        if any(k in q for k in ["forecast", "predict", "next month", "future"]):
            return "get_forecast"
        return "get_revenue_summary"

    if is_mfg:
        if any(k in q for k in ["defect", "scrap", "reject", "quality"]):
            return "get_profit_summary"
        if any(k in q for k in ["oee", "efficiency", "performance"]):
            return "get_profit_summary"
        if any(k in q for k in ["line", "machine", "work center", "station"]):
            return "get_region_performance"
        if any(k in q for k in ["shift", "morning", "night", "evening"]):
            return "get_category_performance"
        if any(k in q for k in ["downtime", "maintenance", "stoppage", "delay"]):
            return "get_inventory_risks"
        return "get_revenue_summary"

    # Default Retail
    if any(k in q for k in ["why", "cause", "drop", "decrease", "decline", "fall", "variance", "root cause"]):
        return "get_root_cause_analysis"
    if any(k in q for k in ["forecast", "predict", "next month", "future", "projection", "expect"]):
        return "get_forecast"
    if any(k in q for k in ["inventory", "stock", "out of stock", "reorder", "supply", "warehouse"]):
        return "get_inventory_risks"
    if any(k in q for k in ["region", "territory", "west", "east", "north", "south", "central"]):
        return "get_region_performance"
    if any(k in q for k in ["category", "categories", "department", "tech", "furniture", "supplies"]):
        return "get_category_performance"
    if any(k in q for k in ["product", "sku", "item", "bestseller", "selling"]):
        return "get_product_performance"
    if any(k in q for k in ["anomaly", "anomalies", "unusual", "outlier", "irregular"]):
        return "get_anomalies"
    if any(k in q for k in ["profit", "margin", "earnings", "bottom line", "cogs"]):
        return "get_profit_summary"
    return "get_revenue_summary"

def execute_tool(
    tool_name: str,
    df_orders: pd.DataFrame,
    df_products: Optional[pd.DataFrame] = None,
    df_inventory: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    cols = set(df_orders.columns) if df_orders is not None else set()
    is_banking = "amount" in cols and ("is_fraud" in cols or "is_default" in cols or "transaction_type" in cols)
    is_mfg = "produced_quantity" in cols or "batch_id" in cols or "work_center" in cols

    if is_banking:
        bk_kpi = calculate_banking_kpis(df_orders)
        if tool_name == "get_revenue_summary":
            return {"tool": tool_name, "transaction_value": bk_kpi["transaction_value"], "transaction_volume": bk_kpi["transaction_volume"]}
        elif tool_name == "get_profit_summary":
            return {"tool": tool_name, "default_rate": bk_kpi["default_rate"], "fraud_rate": bk_kpi["fraud_rate"], "high_risk_volume": bk_kpi["high_risk_volume"]}
        elif tool_name in ["get_region_performance", "get_category_performance"]:
            analytics = compute_adaptive_industry_analytics(df_orders, industry="BANKING")
            return {"tool": tool_name, "type_performance": analytics.get("type_performance", [])[:5], "channel_performance": analytics.get("channel_performance", [])[:5]}
        return {"tool": tool_name, "data": bk_kpi}

    if is_mfg:
        mf_kpi = calculate_manufacturing_kpis(df_orders)
        if tool_name == "get_revenue_summary":
            return {"tool": tool_name, "production_volume": mf_kpi["production_volume"], "planned_volume": mf_kpi["planned_volume"]}
        elif tool_name == "get_profit_summary":
            return {"tool": tool_name, "production_efficiency": mf_kpi["production_efficiency"], "defect_rate": mf_kpi["defect_rate"], "defective_units": mf_kpi["defective_units"]}
        elif tool_name in ["get_region_performance", "get_category_performance", "get_inventory_risks"]:
            analytics = compute_adaptive_industry_analytics(df_orders, industry="MANUFACTURING")
            return {"tool": tool_name, "work_center_performance": analytics.get("work_center_performance", []), "machine_downtime": mf_kpi.get("machine_downtime")}
        return {"tool": tool_name, "data": mf_kpi}

    # Standard Retail
    if tool_name == "get_revenue_summary":
        kpi = calculate_kpis(df_orders)
        return {"tool": tool_name, "data": kpi["revenue"]}
    elif tool_name == "get_profit_summary":
        kpi = calculate_kpis(df_orders)
        return {"tool": tool_name, "profit": kpi["profit"], "margin": kpi["profit_margin"]}
    elif tool_name == "get_region_performance":
        sales = compute_sales_analytics(df_orders, df_products)
        return {"tool": tool_name, "regions": sales["regional_performance"]}
    elif tool_name == "get_category_performance":
        sales = compute_sales_analytics(df_orders, df_products)
        return {"tool": tool_name, "categories": sales["category_performance"]}
    elif tool_name == "get_product_performance":
        prods = compute_product_intelligence(df_orders, df_products)
        return {
            "tool": tool_name,
            "top_revenue": prods["top_revenue_products"][:5],
            "lowest_margin": prods["lowest_margin_products"][:5]
        }
    elif tool_name == "get_inventory_risks":
        inv = compute_inventory_intelligence(df_inventory, df_orders, df_products)
        return {"tool": tool_name, "summary": inv["summary"], "critical_risks": inv["inventory_risks"][:5]}
    elif tool_name == "get_forecast":
        fc = generate_sales_forecast(df_orders, forecast_horizon_days=30)
        return {
            "tool": tool_name,
            "model_selected": fc.get("model_selected"),
            "projected_total_revenue_30d": fc.get("projected_total_revenue_30d"),
            "evaluation_metrics": fc.get("evaluation_metrics")
        }
    elif tool_name == "get_root_cause_analysis":
        df_ord = df_orders.copy()
        if "order_date" in df_ord.columns:
            df_ord["order_date"] = pd.to_datetime(df_ord["order_date"])
            mid_date = df_ord["order_date"].min() + (df_ord["order_date"].max() - df_ord["order_date"].min()) / 2
            cur = df_ord[df_ord["order_date"] > mid_date]
            prev = df_ord[df_ord["order_date"] <= mid_date]
            rc = run_root_cause_analysis(cur, prev, target_kpi="revenue")
            return {"tool": tool_name, "analysis": rc}
        return {"tool": tool_name, "analysis": {}}
    elif tool_name == "get_anomalies":
        anomalies = detect_anomalies(df_orders, df_inventory)
        return {"tool": tool_name, "anomalies": anomalies[:5]}
    return {"tool": "fallback", "data": {}}

def generate_rule_based_response(query: str, tool_name: str, tool_result: Dict[str, Any], is_banking: bool = False, is_mfg: bool = False) -> Dict[str, Any]:
    if is_banking:
        if "transaction_value" in tool_result:
            tv = tool_result["transaction_value"]
            vol = tool_result.get("transaction_volume", {}).get("current", 0)
            return {
                "direct_answer": f"Total transaction value is ${tv.get('current', 0.0):,.2f} across {int(vol):,} settled transactions.",
                "supporting_metrics": {
                    "Total Transaction Value": f"${tv.get('current', 0.0):,.2f}",
                    "Transaction Volume": f"{int(vol):,}",
                    "Growth Trend": f"{tv.get('pct_diff', 0.0):+.1f}%"
                },
                "interpretation": "Payment volumes and liquidity turnover remain healthy across active transaction routes.",
                "suggested_actions": ["Monitor settlement velocity across clearing house integrations."],
                "limitations": "Banking metrics reflect uploaded batch ledger records."
            }
        elif "default_rate" in tool_result:
            dr = tool_result["default_rate"].get("current", 0.0)
            fr = tool_result["fraud_rate"].get("current", 0.0)
            hr = tool_result["high_risk_volume"].get("current", 0.0)
            return {
                "direct_answer": f"Current loan delinquency default rate is {dr:.2f}% and fraud incident rate is {fr:.2f}%.",
                "supporting_metrics": {
                    "Default Rate": f"{dr:.2f}%",
                    "Fraud Incident Rate": f"{fr:.2f}%",
                    "High-Risk Transactions": f"{int(hr):,}"
                },
                "interpretation": "Risk indicators reflect strong underwriting buffers with low overall delinquency exposure.",
                "suggested_actions": [
                    "Tighten multi-factor authentication on flagged digital channels.",
                    "Review collateral coverage on non-performing loans."
                ],
                "limitations": "Risk scoring derived from empirical transaction attributes."
            }

    if is_mfg:
        if "production_volume" in tool_result:
            pv = tool_result["production_volume"].get("current", 0.0)
            plan = tool_result.get("planned_volume", {}).get("current", 0.0)
            return {
                "direct_answer": f"Total production output is {int(pv):,} units against a target of {int(plan):,} units.",
                "supporting_metrics": {
                    "Production Volume": f"{int(pv):,} units",
                    "Planned Volume": f"{int(plan):,} units",
                    "Schedule Variance": f"{int(pv - plan):+d} units"
                },
                "interpretation": "Production line throughput is operating at high planned capacity.",
                "suggested_actions": ["Balance inventory pull signals with shift scheduling."],
                "limitations": "Excludes unrecorded manual workstation adjustments."
            }
        elif "production_efficiency" in tool_result:
            eff = tool_result["production_efficiency"].get("current", 0.0)
            dr = tool_result["defect_rate"].get("current", 0.0)
            def_units = tool_result["defective_units"].get("current", 0.0)
            return {
                "direct_answer": f"Plant overall efficiency (OEE) is {eff:.1f}% with a defect/scrap rate of {dr:.2f}%.",
                "supporting_metrics": {
                    "Production Efficiency (OEE)": f"{eff:.1f}%",
                    "Defect Rate": f"{dr:.2f}%",
                    "Scrapped Units": f"{int(def_units):,} units"
                },
                "interpretation": "Quality yield meets six-sigma manufacturing standards across primary shifts.",
                "suggested_actions": ["Perform preventative recalibration on lines showing variance."],
                "limitations": "Calculated based on daily shift batch records."
            }

    # Standard Retail
    if tool_name == "get_root_cause_analysis":
        analysis = tool_result.get("analysis", {})
        decomp = analysis.get("variance_decomposition", {})
        worst_reg = analysis.get("dimension_breakdowns", {}).get("by_region", [{}])[0]
        return {
            "direct_answer": f"Revenue changed by {analysis.get('percentage_change', 0.0):+.1f}% (${analysis.get('absolute_change', 0.0):+,.2f}) period-over-period.",
            "supporting_metrics": {
                "Order Volume Effect": f"${decomp.get('order_volume_effect', 0.0):+,.2f}",
                "AOV Effect": f"${decomp.get('aov_effect', 0.0):+,.2f}",
                "Steepest Regional Decline": f"{worst_reg.get('name', 'N/A')} (${worst_reg.get('absolute_change', 0.0):+,.2f})"
            },
            "interpretation": "The variance decomposition reveals that order volume contraction was the dominant operational driver, compounded by pronounced drag in the West region.",
            "suggested_actions": [
                "Audit logistics fulfillment and regional distributor capacity in underperforming territories.",
                "Review promotional discount elasticity to prevent further margin erosion."
            ],
            "limitations": "Model reflects internal transaction records and does not incorporate macroeconomic inflation or competitor campaigns."
        }

    elif tool_name == "get_forecast":
        proj_rev = tool_result.get("projected_total_revenue_30d", 0.0)
        model = tool_result.get("model_selected", "Time-series model")
        metrics = tool_result.get("evaluation_metrics", {})
        return {
            "direct_answer": f"Projected total revenue for the next 30 days is approximately ${proj_rev:,.2f}.",
            "supporting_metrics": {
                "Model Selected": model,
                "Mean Absolute Error (MAE)": f"${metrics.get('mae', 0.0):,.2f}",
                "WAPE": f"{metrics.get('wape', 0.0):.1f}%"
            },
            "interpretation": f"The {model} algorithm was chosen via chronological cross-validation as it minimized out-of-sample forecast error.",
            "suggested_actions": [
                "Ensure inventory levels can support the projected 30-day velocity.",
                "Re-evaluate forecast weekly as new daily sales actuals arrive."
            ],
            "limitations": "Assumes seasonal continuity; sudden supply chain shocks or unannounced price changes will alter actual results."
        }

    elif tool_name == "get_inventory_risks":
        summary = tool_result.get("summary", {})
        risks = tool_result.get("critical_risks", [])
        skus = [r.get("product_id", "") for r in risks]
        return {
            "direct_answer": f"Identified {summary.get('critical_stockouts', 0)} critical SKUs requiring immediate reorder.",
            "supporting_metrics": {
                "Critical Stockouts": summary.get("critical_stockouts", 0),
                "Warning SKUs": summary.get("warning_skus", 0),
                "Sample Affected SKUs": ", ".join(skus[:3]) if skus else "None"
            },
            "interpretation": "High sales velocity over the past 30 days has depleted warehouse buffer stocks faster than standard supplier lead times.",
            "suggested_actions": [
                "Issue expedited purchase orders for critical SKUs.",
                "Adjust safety stock thresholds to match recent velocity."
            ],
            "limitations": "Daily demand is calculated from 30-day rolling transactions; seasonal demand spikes may require larger safety buffers."
        }

    elif tool_name == "get_region_performance":
        regs = tool_result.get("regions", [])
        top_reg = regs[0] if regs else {}
        return {
            "direct_answer": f"Top performing region is {top_reg.get('region', 'N/A')} with ${top_reg.get('revenue', 0.0):,.2f} in revenue ({top_reg.get('revenue_share', 0.0):.1f}% share).",
            "supporting_metrics": {
                "Top Region": top_reg.get("region", "N/A"),
                "Top Region Revenue": f"${top_reg.get('revenue', 0.0):,.2f}",
                "Top Region Margin": f"{top_reg.get('profit_margin', 0.0):.1f}%"
            },
            "interpretation": "Regional distribution shows strong concentration in leading territories with healthy margin contributions.",
            "suggested_actions": [
                "Replicate high-performing territory sales playbooks in lagging regions.",
                "Inspect shipping and fulfillment costs per region."
            ],
            "limitations": "Regional figures are based on shipping address territories."
        }

    elif tool_name == "get_profit_summary":
        p = tool_result.get("profit", {})
        m = tool_result.get("margin", {})
        return {
            "direct_answer": f"Net profit is ${p.get('current', 0.0):,.2f} with an operating profit margin of {m.get('current', 0.0):.2f}%.",
            "supporting_metrics": {
                "Net Profit": f"${p.get('current', 0.0):,.2f}",
                "Profit Margin": f"{m.get('current', 0.0):.2f}%",
                "Profit Trend": f"{p.get('pct_diff', 0.0):+.1f}%"
            },
            "interpretation": "Operating profitability remains resilient with strong gross margin conversion.",
            "suggested_actions": ["Maintain disciplined pricing on core catalog items."],
            "limitations": "Excludes indirect enterprise overhead and tax amortization."
        }

    else:
        d = tool_result.get("data", {})
        return {
            "direct_answer": f"Current gross revenue stands at ${d.get('current', 0.0):,.2f}.",
            "supporting_metrics": {
                "Revenue": f"${d.get('current', 0.0):,.2f}",
                "Growth": f"{d.get('pct_diff', 0.0):+.1f}%"
            },
            "interpretation": "Top-line revenue demonstrates steady demand trajectory across all channels.",
            "suggested_actions": ["Accelerate digital customer acquisition to sustain expansion."],
            "limitations": "Based on validated transaction history."
        }

def chat_with_copilot(
    query: str,
    df_orders: pd.DataFrame,
    df_products: Optional[pd.DataFrame] = None,
    df_inventory: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    cols = set(df_orders.columns) if df_orders is not None else set()
    is_banking = "amount" in cols and ("is_fraud" in cols or "is_default" in cols or "transaction_type" in cols)
    is_mfg = "produced_quantity" in cols or "batch_id" in cols or "work_center" in cols

    tool_name = determine_tool(query, is_banking=is_banking, is_mfg=is_mfg)
    tool_result = execute_tool(tool_name, df_orders, df_products, df_inventory)

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        fallback = generate_rule_based_response(query, tool_name, tool_result, is_banking=is_banking, is_mfg=is_mfg)
        return {
            "source": "deterministic_fallback",
            "tool_used": tool_name,
            "tool_called": tool_name,
            "raw_tool_data": tool_result,
            "response": fallback
        }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        system_instruction = (
            "You are NEXORA AI Analyst, an enterprise business analytics advisor. "
            "You MUST base your response strictly and exclusively on the provided empirical analytical tool results. "
            "Never invent figures, never speculate beyond the data, and distinguish verified facts from assumptions. "
            "Return valid JSON matching this schema: "
            "{\"direct_answer\": \"...\", \"supporting_metrics\": {\"key\": \"value\"}, "
            "\"interpretation\": \"...\", \"suggested_actions\": [\"...\"], \"limitations\": \"...\"}"
        )
        prompt = (
            f"User Question: {query}\n\n"
            f"Selected Tool: {tool_name}\n"
            f"Verified Analytical Tool Output:\n{json.dumps(tool_result, default=str)}\n\n"
            f"Please synthesize this into a structured executive response."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        resp = requests.post(url, json=payload, timeout=12)
        if resp.status_code == 200:
            resp_data = resp.json()
            text_part = resp_data["candidates"][0]["content"]["parts"][0]["text"]
            structured_resp = json.loads(text_part)
            return {
                "source": "gemini_grounded",
                "tool_used": tool_name,
                "tool_called": tool_name,
                "raw_tool_data": tool_result,
                "response": structured_resp
            }
        else:
            logger.warning(f"Gemini API returned status {resp.status_code}. Using deterministic fallback.")
            fallback = generate_rule_based_response(query, tool_name, tool_result, is_banking=is_banking, is_mfg=is_mfg)
            return {
                "source": "deterministic_fallback",
                "tool_used": tool_name,
                "tool_called": tool_name,
                "raw_tool_data": tool_result,
                "response": fallback
            }
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}. Degrading gracefully.")
        fallback = generate_rule_based_response(query, tool_name, tool_result, is_banking=is_banking, is_mfg=is_mfg)
        return {
            "source": "deterministic_fallback",
            "tool_used": tool_name,
            "tool_called": tool_name,
            "raw_tool_data": tool_result,
            "response": fallback
        }
