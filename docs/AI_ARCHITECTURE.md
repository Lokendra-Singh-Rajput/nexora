# NEXORA — AI Architecture & Copilot Grounding Specification
**Document ID: NEX-AI-2026**

---

## 1. Zero-Hallucination Design Philosophy

In high-stakes enterprise analytics, a generative AI model must never be allowed to "invent" numbers or guess at financial figures. 

NEXORA prevents hallucinations by enforcing a **Controlled Tool Calling Retrieval Pattern**:

1. **No Arbitrary SQL Generation**: The LLM is strictly prohibited from writing or executing free-form SQL against production databases. Allowing an LLM to generate SQL creates SQL-injection risks, query timeouts, and table locks.
2. **Deterministic Analytical Tools**: All numerical operations are pre-implemented in Python and thoroughly unit-tested.
3. **Structured Context Injection**: The LLM acts purely as an **evidence interpreter and executive communicator**. It receives factual JSON outputs produced by the Python analytics engine and formats business summaries.

---

## 2. Controlled Analytical Tools Catalog

| Tool Identifier | Description | Analytical Execution Location |
| :--- | :--- | :--- |
| `get_revenue_summary` | Evaluates total sales, previous period baseline, growth %, and trajectory. | `app/metrics/kpis.py` |
| `get_profit_summary` | Computes net profit, profit margin %, and cost deductions. | `app/metrics/kpis.py` |
| `get_region_performance` | Returns regional sales ranking, margin by territory, and revenue shares. | `app/sales/sales_analytics.py` |
| `get_category_performance`| Returns department volume, revenue concentration, and category margins. | `app/sales/sales_analytics.py` |
| `get_product_performance` | Identifies top 10 bestsellers, lowest margin products, and margin traps. | `app/products/product_intelligence.py` |
| `get_inventory_risks` | Computes 30-day velocity, days of coverage, and stockout alert SKUs. | `app/inventory/inventory_intelligence.py`|
| `get_root_cause_analysis` | Executes exact three-factor variance decomposition on revenue or profit. | `app/root_cause/analyzer.py` |
| `get_forecast` | Returns 30-day forward sales forecast with 95% confidence bounds. | `app/forecasting/forecaster.py` |
| `get_anomalies` | Evaluates rolling 14-day Z-scores and IQR margin compression anomalies. | `app/anomaly/detector.py` |

---

## 3. Strict Prompt Conditioning & System Instructions

When calling the Google Gemini API (`gemini-2.5-flash`), the system instruction enforces strict grounding:

```
You are NEXORA AI Analyst, an enterprise business analytics advisor.
You MUST base your response strictly and exclusively on the provided empirical analytical tool results.
Never invent figures, never speculate beyond the data, and distinguish verified facts from assumptions.
Return valid JSON matching this schema:
{
  "direct_answer": "...",
  "supporting_metrics": {"key": "value"},
  "interpretation": "...",
  "suggested_actions": ["..."],
  "limitations": "..."
}
```

---

## 4. Graceful Degradation Engine

If `GEMINI_API_KEY` is not present in the environment or if an upstream network error occurs, NEXORA invokes `generate_rule_based_response`.

The deterministic engine:
1. Formats the verified facts from the tool execution.
2. Identifies the primary variance driver (e.g. Order Volume Effect vs AOV Effect).
3. Names the steepest declining territory and category.
4. Generates verified operational prescriptions and evidence limitations.
5. Returns a response matching the exact JSON schema with badge `source: "deterministic_rules_engine"`.

The user experience remains completely uninterrupted and 100% reliable.
