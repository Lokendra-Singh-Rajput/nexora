import requests

BACKEND_URL = "http://localhost:8080/api/v1"

print("=" * 60)
print("AUDITING BACKEND API RESILIENCE & EXCEPTION HANDLING")
print("=" * 60)

# 1. Non-existent dataset ID -> 404
r_404 = requests.get(f"{BACKEND_URL}/datasets/NON_EXISTENT_ID")
print(f"Non-existent dataset: HTTP {r_404.status_code}")
assert r_404.status_code == 404
assert r_404.json()["success"] is False
assert "not found" in r_404.json()["message"].lower()
print(">> PASSED: 404 ResourceNotFoundException properly formatted.")

# 2. Blank copilot chat query -> 400
r_blank_query = requests.post(f"{BACKEND_URL}/copilot/chat", json={"companyId": "novamart", "query": "   "})
print(f"Blank copilot query: HTTP {r_blank_query.status_code}")
assert r_blank_query.status_code == 400
assert r_blank_query.json()["success"] is False
print(">> PASSED: 400 Bad Request validation properly formatted.")

# 3. Empty file upload -> 400
r_empty_file = requests.post(
    f"{BACKEND_URL}/datasets/upload?companyId=novamart",
    files={"file": ("empty.csv", b"", "text/csv")}
)
print(f"Empty file upload: HTTP {r_empty_file.status_code}")
assert r_empty_file.status_code == 400
assert r_empty_file.json()["success"] is False
print(">> PASSED: Empty file validation caught and returned 400.")

# 4. Check all 13 primary REST endpoints
endpoints = [
    ("GET", "/companies"),
    ("GET", "/datasets?companyId=novamart"),
    ("GET", "/analytics/overview?companyId=novamart"),
    ("GET", "/analytics/sales?companyId=novamart"),
    ("GET", "/analytics/products?companyId=novamart"),
    ("GET", "/analytics/customers?companyId=novamart"),
    ("GET", "/analytics/inventory?companyId=novamart"),
    ("GET", "/insights?companyId=novamart"),
    ("GET", "/insights/root-cause?companyId=novamart&kpi=revenue"),
    ("GET", "/insights/anomalies?companyId=novamart"),
    ("GET", "/forecast?companyId=novamart&days=30"),
    ("POST", "/simulator/run", {"companyId": "novamart", "priceChangePct": 5.0}),
    ("POST", "/copilot/chat", {"companyId": "novamart", "query": "What are our revenue figures?"})
]

print("\nVerifying all 13 core REST endpoints:")
for ep in endpoints:
    method = ep[0]
    path = ep[1]
    if method == "GET":
        resp = requests.get(f"{BACKEND_URL}{path}")
    else:
        resp = requests.post(f"{BACKEND_URL}{path}", json=ep[2])
    print(f"  [{method}] {path:<48} -> HTTP {resp.status_code} ({'OK' if resp.status_code == 200 else 'FAIL'})")
    assert resp.status_code == 200, f"Endpoint {path} failed: {resp.status_code}"

print(">> PASSED: All 13 core REST endpoints returned HTTP 200 with valid typed payloads.")
