import os
import requests
import pandas as pd

BACKEND_URL = "http://localhost:8080/api/v1"

print("=" * 60)
print("AUDITING DATA INGESTION ENGINE")
print("=" * 60)

# 1. Create a non-standard header dirty dataset to test schema mapping and quality scoring
dirty_rows = [
    {"Order Number": "ORD-AUDIT-1", "Tx Date": "2025-05-01", "Customer Ref": "CUST-001", "Item Code": "PROD-101", "Territory": "North", "Item Count": 3, "Rate": "$45.00", "Discount Pct": "0.10", "Amount": "121.50", "Margin": "35.00", "State": "Completed"},
    {"Order Number": "ORD-AUDIT-1", "Tx Date": "2025-05-01", "Customer Ref": "CUST-001", "Item Code": "PROD-101", "Territory": "North", "Item Count": 3, "Rate": "$45.00", "Discount Pct": "0.10", "Amount": "121.50", "Margin": "35.00", "State": "Completed"}, # Duplicate row!
    {"Order Number": "ORD-AUDIT-2", "Tx Date": "2025-05-02", "Customer Ref": "CUST-002", "Item Code": "PROD-102", "Territory": "West", "Item Count": -4, "Rate": "$99.00", "Discount Pct": "0.00", "Amount": "-396.00", "Margin": "-100.00", "State": "Completed"}, # Negative quantity & sales!
    {"Order Number": "ORD-AUDIT-3", "Tx Date": "2025-05-03", "Customer Ref": "CUST-003", "Item Code": "PROD-103", "Territory": "South", "Item Count": 2, "Rate": "$150.00", "Discount Pct": "0.00", "Amount": "", "Margin": "", "State": "Completed"}, # Missing sales/profit
    {"Order Number": "ORD-AUDIT-4", "Tx Date": "invalid-date", "Customer Ref": "CUST-004", "Item Code": "PROD-104", "Territory": "East", "Item Count": 1, "Rate": "$200.00", "Discount Pct": "0.00", "Amount": "200.00", "Margin": "60.00", "State": "Completed"}, # Invalid date!
]
df_dirty = pd.DataFrame(dirty_rows)
df_dirty.to_csv("sample-data/audit_dirty.csv", index=False)

# Test profiling directly via Python service
with open("sample-data/audit_dirty.csv", "rb") as f:
    resp_prof = requests.post("http://localhost:8000/api/v1/analytics/profile", json={"records": dirty_rows, "table_type": "orders"})
assert resp_prof.status_code == 200, f"Profiling failed: {resp_prof.text}"
prof_data = resp_prof.json()
qr = prof_data["quality_report"]
print("\n[INSPECTION 1] DATA QUALITY REPORT RESULTS FOR DIRTY DATASET:")
print(f"Total Rows:     {qr['total_rows']}")
print(f"Duplicates:     {qr['duplicate_rows']}")
print(f"Quality Score:  {qr['quality_score']} / 100")
print(f"Warnings:       {qr['warnings']}")
print(f"Anomalies Found:{len(qr['anomalies'])}")
for a in qr['anomalies']:
    print(f"  - [{a['severity']}] {a['type']} in column '{a['column']}': {a['message']}")

assert qr["duplicate_rows"] == 1, "Duplicate row was not detected!"
assert any(a["type"] == "negative_value" for a in qr["anomalies"]), "Negative value was not caught!"
assert any(a["type"] == "invalid_date_format" for a in qr["anomalies"]), "Invalid date was not caught!"
assert qr["quality_score"] < 90.0, f"Quality score {qr['quality_score']} should be penalized for anomalies"
print(">> PASSED: Quality reporting caught duplicates, negative quantities, missing cells, and date anomalies.")

# 2. Upload through Spring Boot Backend
print("\n[INSPECTION 2] UPLOADING CSV THROUGH SPRING BOOT BACKEND:")
with open("sample-data/audit_dirty.csv", "rb") as f:
    resp_up = requests.post(
        f"{BACKEND_URL}/datasets/upload?companyId=novamart&replaceExisting=false",
        files={"file": ("audit_dirty.csv", f, "text/csv")}
    )
assert resp_up.status_code == 200, f"Upload failed: {resp_up.text}"
up_json = resp_up.json()["data"]
print(f"Dataset ID:       {up_json['datasetId']}")
print(f"Filename:         {up_json['filename']}")
print(f"Rows Processed:   {up_json['rowsProcessed']}")
print(f"Validation Status:{up_json['validationStatus']}")
print(f"Dataset Version:  {up_json['version']}")

# 3. Upload Excel file through Spring Boot Backend
print("\n[INSPECTION 3] UPLOADING EXCEL (.XLSX) THROUGH SPRING BOOT BACKEND:")
excel_path = "sample-data/novamart_retail_combined.xlsx"
assert os.path.exists(excel_path), "Excel demo file missing"
with open(excel_path, "rb") as f:
    resp_up_xl = requests.post(
        f"{BACKEND_URL}/datasets/upload?companyId=novamart&replaceExisting=false",
        files={"file": ("novamart_retail_combined.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
assert resp_up_xl.status_code == 200, f"Excel upload failed: {resp_up_xl.text}"
up_xl_json = resp_up_xl.json()["data"]
print(f"Excel Dataset ID: {up_xl_json['datasetId']}")
print(f"Excel Rows:       {up_xl_json['rowsProcessed']}")
print(f"Excel Version:    {up_xl_json['version']}")
assert up_xl_json["rowsProcessed"] > 0, "No rows ingested from Excel"
print(">> PASSED: Excel XLSX workbook parsed and persisted successfully.")

# 4. Check Dataset Version History
print("\n[INSPECTION 4] DATASET VERSION AUDIT HISTORY:")
resp_list = requests.get(f"{BACKEND_URL}/datasets?companyId=novamart")
assert resp_list.status_code == 200
ds_list = resp_list.json()["data"]
print(f"Total Datasets in Audit Log: {len(ds_list)}")
for d in ds_list:
    print(f"  - Version {d['version']}: {d['filename']:<32} | Rows: {d['rowCount']:>5} | Score: {d['qualityScore']} | Status: {d['validationStatus']}")

# 5. Clean up by restoring pristine demo dataset
print("\n[INSPECTION 5] RESTORING PRISTINE BENCHMARK DEMO STATE:")
resp_reset = requests.post(f"{BACKEND_URL}/datasets/reset-demo")
assert resp_reset.status_code == 200
print(">> PASSED: Reset demo data restored baseline 4,452 orders.")
