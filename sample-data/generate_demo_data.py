import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Set seed for reproducible synthetic dataset
random.seed(42)
np.random.seed(42)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Products
CATEGORIES = {
    "Technology": {
        "sub_categories": {
            "Laptops": [("NovaBook Pro 15", 850.0, 1299.0), ("NovaBook Air 13", 650.0, 999.0), ("UltraDesk Studio PC", 1100.0, 1699.0)],
            "Accessories": [("Ergo Wireless Mouse", 18.0, 45.0), ("Mechanical Keyboard RGB", 42.0, 89.0), ("USB-C Triple Hub", 22.0, 59.0)],
            "Audio": [("NovaSonic ANC Headphones", 75.0, 179.0), ("ClearTone Wireless Earbuds", 35.0, 79.0), ("Studio Conference Speaker", 60.0, 129.0)],
            "Monitors": [("UltraWide 34-inch 4K", 280.0, 499.0), ("ProColor 27-inch IPS", 180.0, 319.0)]
        }
    },
    "Furniture": {
        "sub_categories": {
            "Chairs": [("ErgoComfort Mesh Chair", 160.0, 249.0), ("Executive Leather Recliner", 230.0, 329.0)],
            "Desks": [("NovaLift Motorized Standing Desk", 310.0, 479.0), ("Compact Wood Workstation", 120.0, 189.0)],
            "Storage": [("Steel 3-Drawer Filing Cabinet", 65.0, 119.0), ("Modular Bamboo Bookcase", 85.0, 149.0)]
        }
    },
    "Office Supplies": {
        "sub_categories": {
            "Paper": [("EcoBright Multipurpose Paper 500ct", 4.5, 9.99), ("Heavy Cardstock Premium 250ct", 6.0, 14.99)],
            "Binders & Folders": [("Heavy-Duty Presentation Binder 3-Ring", 3.2, 7.99), ("Expanding File Organizer 12-Tab", 5.5, 12.99)],
            "Writing": [("Gel Retractable Pens 12-Pack", 3.0, 8.5), ("Precision Highlighter Pack 6ct", 2.2, 5.99)]
        }
    },
    "Apparel": {
        "sub_categories": {
            "Activewear": [("NovaBreeze Performance Polo", 16.0, 39.0), ("Thermal Core Fleece Jacket", 28.0, 69.0)],
            "Workwear": [("Tailored Stretch Chino", 24.0, 59.0), ("Classic Oxford Button-Down", 20.0, 49.0)]
        }
    }
}

products_list = []
prod_idx = 101
for cat, subcats in CATEGORIES.items():
    for subcat, items in subcats["sub_categories"].items():
        for name, cost, price in items:
            pid = f"PROD-{prod_idx}"
            products_list.append({
                "product_id": pid,
                "product_name": name,
                "category": cat,
                "sub_category": subcat,
                "unit_cost": cost,
                "selling_price": price
            })
            prod_idx += 1

df_products = pd.DataFrame(products_list)

# 2. Customers
REGIONS = ["North", "South", "East", "West", "Central"]
SEGMENTS = ["Consumer", "Corporate", "Small Business"]
FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

customers_list = []
base_date = datetime(2024, 1, 1)

for cid in range(1, 201):
    c_id = f"CUST-{cid:04d}"
    seg = random.choices(SEGMENTS, weights=[0.50, 0.30, 0.20])[0]
    reg = random.choice(REGIONS)
    acq_offset = random.randint(0, 450)
    acq_date = (base_date + timedelta(days=acq_offset)).strftime("%Y-%m-%d")
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    customers_list.append({
        "customer_id": c_id,
        "customer_name": name,
        "segment": seg,
        "region": reg,
        "acquisition_date": acq_date
    })

df_customers = pd.DataFrame(customers_list)

# 3. Orders Generation (12 months of rich data from Nov 1, 2024 to Oct 31, 2025)
start_date = datetime(2024, 11, 1)
end_date = datetime(2025, 10, 31)
total_days = (end_date - start_date).days

orders_list = []
order_num = 10001

for day_offset in range(total_days + 1):
    curr_date = start_date + timedelta(days=day_offset)
    curr_date_str = curr_date.strftime("%Y-%m-%d")
    month_num = curr_date.month
    
    # Seasonality factor: Q4 (Nov-Dec) has high orders, summer has dip
    seasonality = 1.0
    if month_num in [11, 12]:
        seasonality = 1.35
    elif month_num in [6, 7]:
        seasonality = 0.90
    elif month_num in [8, 9, 10]:
        seasonality = 1.05
    
    # Orders per day
    num_orders = int(np.random.poisson(lam=12 * seasonality))
    num_orders = max(4, num_orders)

    for _ in range(num_orders):
        oid = f"ORD-{order_num}"
        order_num += 1
        
        cust = random.choice(customers_list)
        cid = cust["customer_id"]
        region = cust["region"]
        segment = cust["segment"]
        
        # Product selection
        prod = random.choice(products_list)
        pid = prod["product_id"]
        u_price = prod["selling_price"]
        u_cost = prod["unit_cost"]
        
        # Quantity based on segment
        if segment == "Corporate":
            qty = random.randint(2, 8)
        elif segment == "Small Business":
            qty = random.randint(1, 4)
        else:
            qty = random.randint(1, 3)
            
        # Realistic business anomaly: West region revenue drops in Sep & Oct 2025
        if region == "West" and curr_date >= datetime(2025, 9, 1):
            if random.random() < 0.45:
                # Cancelled or lower quantity order due to supply issues in West
                qty = max(1, int(qty * 0.5))
        
        # Realistic business anomaly: Technology subcategory Laptops margin erosion in Q3 due to heavy promo
        discount = 0.0
        if random.random() < 0.35:
            discount = round(random.choice([0.05, 0.10, 0.15, 0.20]), 2)
            
        if prod["category"] == "Technology" and curr_date >= datetime(2025, 7, 1):
            # Heavy discounts eroding profit margin
            discount = round(random.choice([0.15, 0.20, 0.25, 0.30]), 2)
            
        sales = round(qty * u_price * (1.0 - discount), 2)
        total_cost = round(qty * u_cost, 2)
        profit = round(sales - total_cost, 2)
        
        # Order status
        status_roll = random.random()
        if status_roll < 0.88:
            status = "Completed"
        elif status_roll < 0.94:
            status = "Shipped"
        elif status_roll < 0.98:
            status = "Returned"
            # Return affects profit: return processing cost
            profit = round(-0.15 * sales, 2)
        else:
            status = "Cancelled"
            sales = 0.0
            profit = 0.0

        orders_list.append({
            "order_id": oid,
            "order_date": curr_date_str,
            "customer_id": cid,
            "product_id": pid,
            "region": region,
            "quantity": qty,
            "unit_price": u_price,
            "discount": discount,
            "sales": sales,
            "profit": profit,
            "order_status": status
        })

df_orders = pd.DataFrame(orders_list)

# 4. Inventory Table
inventory_list = []
for p in products_list:
    pid = p["product_id"]
    # 4 high-demand products have stock below reorder level to simulate inventory risk
    if pid in ["PROD-101", "PROD-102", "PROD-107", "PROD-111"]:
        stock = random.randint(5, 14)
        reorder = 25
        lead_time = 14
    else:
        stock = random.randint(40, 250)
        reorder = random.randint(20, 35)
        lead_time = random.choice([5, 7, 10, 14, 21])
        
    inventory_list.append({
        "product_id": pid,
        "stock_quantity": stock,
        "reorder_level": reorder,
        "supplier_lead_time": lead_time
    })

df_inventory = pd.DataFrame(inventory_list)

# 5. Marketing Campaigns
campaign_list = [
    {"campaign_id": "CMP-101", "campaign_name": "Q4 Holiday Kickoff", "marketing_spend": 12000.0, "campaign_revenue": 65000.0, "campaign_date": "2024-11-15", "channel": "Email"},
    {"campaign_id": "CMP-102", "campaign_name": "Cyber Week Blitz", "marketing_spend": 25000.0, "campaign_revenue": 115000.0, "campaign_date": "2024-11-28", "channel": "Search"},
    {"campaign_id": "CMP-103", "campaign_name": "End of Year Tech Clearance", "marketing_spend": 8000.0, "campaign_revenue": 28000.0, "campaign_date": "2024-12-20", "channel": "Social Media"},
    {"campaign_id": "CMP-104", "campaign_name": "New Year Workstation Refresh", "marketing_spend": 14000.0, "campaign_revenue": 49000.0, "campaign_date": "2025-01-12", "channel": "Email"},
    {"campaign_id": "CMP-105", "campaign_name": "Spring Corporate Bulk Promo", "marketing_spend": 18000.0, "campaign_revenue": 72000.0, "campaign_date": "2025-03-10", "channel": "Search"},
    {"campaign_id": "CMP-106", "campaign_name": "Earth Day Eco-Paper Drive", "marketing_spend": 5000.0, "campaign_revenue": 14500.0, "campaign_date": "2025-04-22", "channel": "Email"},
    {"campaign_id": "CMP-107", "campaign_name": "Summer Tech Showcase", "marketing_spend": 22000.0, "campaign_revenue": 54000.0, "campaign_date": "2025-06-15", "channel": "Social Media"},
    {"campaign_id": "CMP-108", "campaign_name": "Display Retargeting Wave 1", "marketing_spend": 16000.0, "campaign_revenue": 11200.0, "campaign_date": "2025-07-20", "channel": "Display"},
    {"campaign_id": "CMP-109", "campaign_name": "Back to School Tech Sale", "marketing_spend": 30000.0, "campaign_revenue": 128000.0, "campaign_date": "2025-08-15", "channel": "Search"},
    {"campaign_id": "CMP-110", "campaign_name": "Display Retargeting Wave 2", "marketing_spend": 15000.0, "campaign_revenue": 10500.0, "campaign_date": "2025-09-10", "channel": "Display"},
    {"campaign_id": "CMP-111", "campaign_name": "Fall Executive Ergonomics", "marketing_spend": 9000.0, "campaign_revenue": 38000.0, "campaign_date": "2025-10-05", "channel": "Email"}
]

df_marketing = pd.DataFrame(campaign_list)

# Export individual CSV files
df_orders.to_csv(os.path.join(OUT_DIR, "orders.csv"), index=False)
df_customers.to_csv(os.path.join(OUT_DIR, "customers.csv"), index=False)
df_products.to_csv(os.path.join(OUT_DIR, "products.csv"), index=False)
df_inventory.to_csv(os.path.join(OUT_DIR, "inventory.csv"), index=False)
df_marketing.to_csv(os.path.join(OUT_DIR, "marketing.csv"), index=False)

# Export combined Excel file with multiple sheets
excel_path = os.path.join(OUT_DIR, "novamart_retail_combined.xlsx")
with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
    df_orders.to_excel(writer, sheet_name="Orders", index=False)
    df_customers.to_excel(writer, sheet_name="Customers", index=False)
    df_products.to_excel(writer, sheet_name="Products", index=False)
    df_inventory.to_excel(writer, sheet_name="Inventory", index=False)
    df_marketing.to_excel(writer, sheet_name="Marketing", index=False)

print(f"Successfully generated synthetic NovaMart Retail dataset!")
print(f"Total Orders: {len(df_orders)}")
print(f"Total Customers: {len(df_customers)}")
print(f"Total Products: {len(df_products)}")
print(f"Total Inventory Items: {len(df_inventory)}")
print(f"Total Marketing Campaigns: {len(df_marketing)}")
print(f"Excel File: {excel_path}")
