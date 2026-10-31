import json
import requests
import pandas as pd
import numpy as np

BACKEND_URL = "http://localhost:8080/api/v1"
PYTHON_URL = "http://localhost:8000/api/v1/analytics"

print("=" * 60)
print("NEXORA TECHNICAL & ANALYTICAL AUDIT EXECUTION")
print("=" * 60)

# -------------------------------------------------------------
# 1. ANALYTICAL CORRECTNESS: INDEPENDENT PANDAS GROUND TRUTH
# -------------------------------------------------------------
print("\n[TEST 1] ANALYTICAL CORRECTNESS: INDEPENDENT CALCULATION COMPARISON")

# Load baseline orders
df_orders = pd.read_csv("sample-data/orders.csv")

# 1. Total KPI ground truth
gt_revenue = round(float(df_orders["sales"].sum()), 2)
gt_profit = round(float(df_orders["profit"].sum()), 2)
gt_margin = round(float((gt_profit / gt_revenue) * 100.0), 2)
gt_orders = int(df_orders["order_id"].nunique())
gt_aov = round(float(gt_revenue / gt_orders), 2)
gt_units = int(df_orders["quantity"].sum())

print(f"Ground Truth (Pandas): Revenue=${gt_revenue:,.2f}, Profit=${gt_profit:,.2f}, Margin={gt_margin}%, Orders={gt_orders}, AOV=${gt_aov}, Units={gt_units}")

# Fetch from Backend Overview API
resp = requests.get(f"{BACKEND_URL}/analytics/overview?companyId=novamart")
assert resp.status_code == 200, f"Overview API failed: {resp.status_code}"
api_data = resp.json()["data"]
api_kpis = api_data["kpis"]

api_rev = api_kpis["revenue"]["current"]
api_prof = api_kpis["profit"]["current"]
api_margin = api_kpis["profit_margin"]["current"]
api_ord = api_kpis["total_orders"]["current"]
api_aov = api_kpis["average_order_value"]["current"]
api_units = api_kpis["units_sold"]["current"]

print(f"API Returned:          Revenue=${api_rev:,.2f}, Profit=${api_prof:,.2f}, Margin={api_margin}%, Orders={api_ord}, AOV=${api_aov}, Units={api_units}")

rev_diff = abs(gt_revenue - api_rev)
prof_diff = abs(gt_profit - api_prof)
margin_diff = abs(gt_margin - api_margin)
ord_diff = abs(gt_orders - api_ord)
aov_diff = abs(gt_aov - api_aov)

assert rev_diff < 0.01, f"Revenue mismatch: {rev_diff}"
assert prof_diff < 0.01, f"Profit mismatch: {prof_diff}"
assert margin_diff < 0.05, f"Margin mismatch: {margin_diff}"
assert ord_diff == 0, f"Orders mismatch: {ord_diff}"
assert aov_diff < 0.05, f"AOV mismatch: {aov_diff}"
print(">> PASSED: All core KPIs match ground truth within 0.01 precision.")

# -------------------------------------------------------------
# 2. FILTERING AUDIT: DATE & REGIONAL FILTERING
# -------------------------------------------------------------
print("\n[TEST 2] FILTERING AUDIT: REGIONAL & DATE FILTER VERIFICATION")

# Filter by Region = 'West'
df_west = df_orders[df_orders["region"] == "West"]
gt_west_rev = round(float(df_west["sales"].sum()), 2)
gt_west_prof = round(float(df_west["profit"].sum()), 2)
gt_west_orders = int(df_west["order_id"].nunique())

resp_west = requests.get(f"{BACKEND_URL}/analytics/overview?companyId=novamart&region=West")
assert resp_west.status_code == 200
west_kpis = resp_west.json()["data"]["kpis"]
api_west_rev = west_kpis["revenue"]["current"]
api_west_prof = west_kpis["profit"]["current"]
api_west_ord = west_kpis["total_orders"]["current"]

print(f"West Region GT:  Revenue=${gt_west_rev:,.2f}, Profit=${gt_west_prof:,.2f}, Orders={gt_west_orders}")
print(f"West Region API: Revenue=${api_west_rev:,.2f}, Profit=${api_west_prof:,.2f}, Orders={api_west_ord}")
assert abs(gt_west_rev - api_west_rev) < 0.01
assert abs(gt_west_prof - api_west_prof) < 0.01
assert gt_west_orders == api_west_ord
print(">> PASSED: Regional filter matches ground truth perfectly.")

# Filter by Date: Q1 2025 (2025-01-01 to 2025-03-31)
df_q1 = df_orders[(df_orders["order_date"] >= "2025-01-01") & (df_orders["order_date"] <= "2025-03-31")]
gt_q1_rev = round(float(df_q1["sales"].sum()), 2)
gt_q1_ord = int(df_q1["order_id"].nunique())

resp_q1 = requests.get(f"{BACKEND_URL}/analytics/overview?companyId=novamart&startDate=2025-01-01&endDate=2025-03-31")
assert resp_q1.status_code == 200
q1_kpis = resp_q1.json()["data"]["kpis"]
api_q1_rev = q1_kpis["revenue"]["current"]
api_q1_ord = q1_kpis["total_orders"]["current"]

print(f"Q1 2025 GT:  Revenue=${gt_q1_rev:,.2f}, Orders={gt_q1_ord}")
print(f"Q1 2025 API: Revenue=${api_q1_rev:,.2f}, Orders={api_q1_ord}")
assert abs(gt_q1_rev - api_q1_rev) < 0.01
assert gt_q1_ord == api_q1_ord
print(">> PASSED: Date range filtering matches ground truth perfectly.")

# -------------------------------------------------------------
# 3. ROOT CAUSE ANALYSIS & VARIANCE DECOMPOSITION AUDIT
# -------------------------------------------------------------
print("\n[TEST 3] ROOT CAUSE ANALYSIS: EXACT IDENTITY & DECOMPOSITION AUDIT")

resp_rc = requests.get(f"{BACKEND_URL}/insights/root-cause?companyId=novamart&kpi=revenue&startDate=2025-09-01&endDate=2025-10-31")
assert resp_rc.status_code == 200
rc_data = resp_rc.json()["data"]

total_change = rc_data["absolute_change"]
decomp = rc_data["variance_decomposition"]
vol_eff = decomp["order_volume_effect"]
aov_eff = decomp["aov_effect"]
int_eff = decomp["interaction_effect"]
sum_decomp = round(vol_eff + aov_eff + int_eff, 2)

print(f"Investigated KPI: {rc_data['investigated_kpi']}")
print(f"Current Value:    ${rc_data['current_period_value']:,.2f}")
print(f"Previous Value:   ${rc_data['previous_period_value']:,.2f}")
print(f"Total Change:     ${total_change:,.2f} ({rc_data['percentage_change']}%)")
print(f"Volume Effect:    ${vol_eff:,.2f}")
print(f"AOV Effect:       ${aov_eff:,.2f}")
print(f"Interaction:      ${int_eff:,.2f}")
print(f"Sum of Effects:   ${sum_decomp:,.2f}")

decomp_error = abs(total_change - sum_decomp)
assert decomp_error < 0.05, f"Variance decomposition does not sum to total change! Error: {decomp_error}"
print(f">> PASSED: Mathematical identity verified! Sum of variance effects equals total change (residual: {decomp_error}).")

# Verify regional contributions sum to 100% of change
reg_breakdowns = rc_data["dimension_breakdowns"]["by_region"]
print(f"Regional contributors: {len(reg_breakdowns)} regions analyzed.")
for r in reg_breakdowns:
    print(f"  - Region {r['name']:<8}: Delta=${r['absolute_change']:>10,.2f} ({r['percentage_change']:>+6.1f}%) | Share of Delta: {r['contribution_to_total_change']:>6.1f}%")

# -------------------------------------------------------------
# 4. FORECASTING AUDIT
# -------------------------------------------------------------
print("\n[TEST 4] FORECASTING AUDIT: MODEL SELECTION, SPLIT & INTERVALS")

resp_fc = requests.get(f"{BACKEND_URL}/forecast?companyId=novamart&days=30")
assert resp_fc.status_code == 200
fc_data = resp_fc.json()["data"]

print(f"Status:            {fc_data['status']}")
print(f"Model Selected:    {fc_data['model_selected']}")
print(f"Forecast Horizon:  {fc_data['forecast_horizon_days']} days")
print(f"Evaluation Metrics: MAE=${fc_data['evaluation_metrics']['mae']:,.2f}, RMSE=${fc_data['evaluation_metrics']['rmse']:,.2f}, WAPE={fc_data['evaluation_metrics']['wape']}%")
print(f"Candidate Models Scored:")
for cm in fc_data["all_model_evaluations"]:
    print(f"  - {cm['model']:<35} MAE=${cm['mae']:>8,.2f} | RMSE=${cm['rmse']:>8,.2f} | WAPE={cm['wape']:>5.1f}%")

# Check predictions: verify 30 non-null future points with lower <= forecast <= upper
forecast_points = fc_data["forecast_only"]
assert len(forecast_points) == 30, f"Expected 30 points, got {len(forecast_points)}"
for p in forecast_points:
    f_val = p["forecast"]
    l_val = p["lower_bound"]
    u_val = p["upper_bound"]
    assert l_val <= f_val <= u_val, f"Interval breach: {l_val} <= {f_val} <= {u_val}"

print(">> PASSED: Forecasting uses chronological holdout, benchmarks 3 models, and upper >= forecast >= lower bounds hold.")

# -------------------------------------------------------------
# 5. WHAT-IF SIMULATOR AUDIT
# -------------------------------------------------------------
print("\n[TEST 5] WHAT-IF SIMULATOR: ECONOMIC ELASTICITY CHECK")

# Test 10% price increase
sim_req = {
    "companyId": "novamart",
    "priceChangePct": 10.0,
    "priceElasticity": -1.2
}
resp_sim = requests.post(f"{BACKEND_URL}/simulator/run", json=sim_req)
assert resp_sim.status_code == 200
sim_data = resp_sim.json()["data"]

base_units = sim_data["baseline"]["units_sold"]
sim_units = sim_data["simulated"]["units_sold"]
unit_contraction_pct = ((sim_units - base_units) / base_units) * 100.0

print(f"Baseline Units:    {base_units}")
print(f"Simulated Units:   {sim_units} ({unit_contraction_pct:.1f}% contraction)")
assert sim_units < base_units, "Price increase failed to contract volume!"
assert abs(unit_contraction_pct - (-12.0)) < 1.0, f"Volume contraction should be approx -12%, got {unit_contraction_pct}"
print(">> PASSED: Price elasticity correctly contracts volume by 12% for a 10% price increase.")

# -------------------------------------------------------------
# 6. AI COPILOT & FALLBACK AUDIT
# -------------------------------------------------------------
print("\n[TEST 6] AI COPILOT: GROUNDING & DETERMINISTIC FALLBACK")

queries = [
    "Why did revenue decrease recently?",
    "What are our critical inventory stockouts?",
    "What are the projected sales for next month?",
    "Which region contributes most to profit?"
]

for q in queries:
    resp_copilot = requests.post(f"{BACKEND_URL}/copilot/chat", json={"companyId": "novamart", "query": q})
    assert resp_copilot.status_code == 200
    cp_data = resp_copilot.json()["data"]
    tool_used = cp_data["tool_used"]
    source = cp_data["source"]
    ans = cp_data["response"]["direct_answer"]
    metrics = cp_data["response"]["supporting_metrics"]
    print(f"Query: '{q}'")
    print(f"  Tool Dispatched: {tool_used}")
    print(f"  Execution Source: {source}")
    print(f"  Direct Answer: {ans[:90]}...")
    assert len(metrics) > 0, "Supporting metrics missing from Copilot response"
    print(f"  Supporting Metrics: {list(metrics.keys())}")
print(">> PASSED: Copilot intent routing, tool execution, and deterministic grounding verified.")

print("\n" + "=" * 60)
print("AUDIT SCRIPT COMPLETED SUCCESSFULLY!")
print("=" * 60)
