import requests
import pandas as pd

BACKEND_URL = "http://localhost:8080/api/v1"

print("=" * 60)
print("AUDITING DYNAMIC DASHBOARD REFRESH ON DATA INGESTION")
print("=" * 60)

# Step 1: Check baseline revenue
r1 = requests.get(f"{BACKEND_URL}/analytics/overview?companyId=novamart")
assert r1.status_code == 200
base_rev = r1.json()["data"]["kpis"]["revenue"]["current"]
base_orders = r1.json()["data"]["kpis"]["total_orders"]["current"]
print(f"Step 1: Baseline Revenue=${base_rev:,.2f}, Total Orders={base_orders}")

# Step 2: Upload new batch of 50 high-value orders ($500,000 extra sales)
new_rows = []
for i in range(1, 51):
    new_rows.append({
        "order_id": f"ORD-NEW-{i:03d}",
        "order_date": "2025-10-31",
        "customer_id": f"CUST-NEW-{i:02d}",
        "product_id": "PROD-101",
        "region": "West",
        "quantity": 10,
        "unit_price": 1000.0,
        "discount": 0.0,
        "sales": 10000.0,
        "profit": 3500.0,
        "order_status": "Completed"
    })
df_new = pd.DataFrame(new_rows)
df_new.to_csv("sample-data/audit_new_sales.csv", index=False)

with open("sample-data/audit_new_sales.csv", "rb") as f:
    up_resp = requests.post(
        f"{BACKEND_URL}/datasets/upload?companyId=novamart&replaceExisting=false",
        files={"file": ("audit_new_sales.csv", f, "text/csv")}
    )
assert up_resp.status_code == 200
print(f"Step 2: Uploaded {len(new_rows)} new orders (+$500,000 expected revenue).")

# Step 3: Query overview KPIs again
r2 = requests.get(f"{BACKEND_URL}/analytics/overview?companyId=novamart")
assert r2.status_code == 200
refreshed_rev = r2.json()["data"]["kpis"]["revenue"]["current"]
refreshed_orders = r2.json()["data"]["kpis"]["total_orders"]["current"]
print(f"Step 3: Refreshed Revenue=${refreshed_rev:,.2f}, Total Orders={refreshed_orders}")

delta_rev = refreshed_rev - base_rev
delta_orders = refreshed_orders - base_orders
print(f"Observed Delta: +${delta_rev:,.2f} Revenue, +{delta_orders} Orders")

assert abs(delta_rev - 500000.0) < 0.01, f"Expected exactly +$500,000, got {delta_rev}"
assert delta_orders == 50, f"Expected +50 orders, got {delta_orders}"
print(">> PASSED: Dynamic dashboard reflects newly ingested data immediately!")

# Step 4: Restore clean baseline
r_reset = requests.post(f"{BACKEND_URL}/datasets/reset-demo")
assert r_reset.status_code == 200
r3 = requests.get(f"{BACKEND_URL}/analytics/overview?companyId=novamart")
restored_rev = r3.json()["data"]["kpis"]["revenue"]["current"]
print(f"Step 4: Restored Baseline Revenue=${restored_rev:,.2f}")
assert abs(restored_rev - base_rev) < 0.01
print(">> PASSED: Reset restored exact pristine baseline.")
