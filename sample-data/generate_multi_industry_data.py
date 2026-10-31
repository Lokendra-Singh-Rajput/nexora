import csv
import random
from datetime import datetime, timedelta

random.seed(42)

# -------------------------------------------------------------
# 1. APEX DIRECT (RETAIL COMPANY #2) - 400 Orders
# -------------------------------------------------------------
apex_orders = []
start_date = datetime(2025, 1, 1)
categories = ["Electronics", "Apparel", "Home Goods"]
regions = ["North", "South", "East", "West"]

for i in range(1, 401):
    order_date = start_date + timedelta(days=random.randint(0, 290))
    qty = random.randint(1, 5)
    unit_price = round(random.uniform(40.0, 450.0), 2)
    discount = round(random.choice([0.0, 0.05, 0.10, 0.15]), 2)
    sales = round(qty * unit_price * (1.0 - discount), 2)
    profit = round(sales * random.uniform(0.18, 0.38), 2)

    apex_orders.append({
        "order_id": f"APX-ORD-{1000 + i}",
        "order_date": order_date.strftime("%Y-%m-%d"),
        "customer_id": f"APX-CUST-{random.randint(1, 80):03d}",
        "product_id": f"APX-SKU-{random.randint(1, 30):02d}",
        "region": random.choice(regions),
        "quantity": qty,
        "unit_price": unit_price,
        "discount": discount,
        "sales": sales,
        "profit": profit,
        "order_status": "Returned" if random.random() < 0.04 else "Completed"
    })

with open("sample-data/apex_retail_orders.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(apex_orders[0].keys()))
    writer.writeheader()
    writer.writerows(apex_orders)

print(f"Generated {len(apex_orders)} orders for Apex Direct Retail.")

# -------------------------------------------------------------
# 2. MERIDIAN TRUST BANK (BANKING) - 500 Transactions
# -------------------------------------------------------------
bank_txns = []
txn_types = ["Wire Transfer", "ACH Deposit", "POS Payment", "ATM Withdrawal", "Loan Disbursement"]
channels = ["Online", "Mobile", "Branch", "ATM", "POS"]

for i in range(1, 501):
    txn_date = start_date + timedelta(days=random.randint(0, 290))
    t_type = random.choice(txn_types)
    
    if t_type == "Wire Transfer":
        amt = round(random.uniform(2000.0, 35000.0), 2)
    elif t_type == "Loan Disbursement":
        amt = round(random.uniform(5000.0, 50000.0), 2)
    elif t_type == "ACH Deposit":
        amt = round(random.uniform(500.0, 8000.0), 2)
    elif t_type == "ATM Withdrawal":
        amt = round(random.choice([40, 80, 100, 200, 400, 500]), 2)
    else:
        amt = round(random.uniform(15.0, 350.0), 2)

    # 3.5% fraud rate, 2.8% default rate (mostly on loans)
    is_fraud = 1 if (random.random() < 0.035 and amt > 250) else 0
    is_default = 1 if (t_type == "Loan Disbursement" and random.random() < 0.08) else 0
    
    if is_fraud:
        risk_score = round(random.uniform(0.78, 0.98), 4)
        status = "Flagged"
    elif is_default:
        risk_score = round(random.uniform(0.72, 0.90), 4)
        status = "Defaulted"
    else:
        risk_score = round(random.uniform(0.01, 0.35), 4)
        status = "Settled"

    bank_txns.append({
        "transaction_id": f"TXN-{20000 + i}",
        "transaction_date": txn_date.strftime("%Y-%m-%d"),
        "account_id": f"ACT-{random.randint(1000, 1150)}",
        "customer_id": f"BNK-CUST-{random.randint(100, 250)}",
        "transaction_type": t_type,
        "amount": amt,
        "is_fraud": is_fraud,
        "risk_score": risk_score,
        "is_default": is_default,
        "status": status,
        "channel": random.choice(channels)
    })

with open("sample-data/meridian_bank_transactions.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(bank_txns[0].keys()))
    writer.writeheader()
    writer.writerows(bank_txns)

print(f"Generated {len(bank_txns)} transactions for Meridian Trust Bank.")

# -------------------------------------------------------------
# 3. VANGUARD PRECISION (MANUFACTURING) - 300 Batches
# -------------------------------------------------------------
mfg_batches = []
work_centers = ["Assembly Line 1", "CNC Machining Center", "Injection Molding 2", "Finishing & Coating"]
shifts = ["Morning", "Afternoon", "Night"]

for i in range(1, 301):
    prod_date = start_date + timedelta(days=random.randint(0, 290))
    planned = random.choice([500, 800, 1000, 1200, 1500])
    eff_factor = random.uniform(0.91, 0.99)
    produced = int(planned * eff_factor)
    defects = int(produced * random.uniform(0.012, 0.038)) # 1.2% - 3.8% scrap
    downtime = int(random.choice([0, 10, 15, 25, 40, 60, 90]))
    eff_pct = round((produced / planned) * 100.0, 2)

    mfg_batches.append({
        "batch_id": f"BATCH-{8000 + i}",
        "production_date": prod_date.strftime("%Y-%m-%d"),
        "work_center": random.choice(work_centers),
        "product_code": f"PART-VN-{random.randint(1, 20):02d}",
        "planned_quantity": planned,
        "produced_quantity": produced,
        "defective_quantity": defects,
        "downtime_minutes": downtime,
        "operating_hours": 8.0,
        "efficiency_pct": eff_pct,
        "shift": random.choice(shifts)
    })

with open("sample-data/vanguard_manufacturing_batches.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(mfg_batches[0].keys()))
    writer.writeheader()
    writer.writerows(mfg_batches)

print(f"Generated {len(mfg_batches)} manufacturing batches for Vanguard Precision.")
