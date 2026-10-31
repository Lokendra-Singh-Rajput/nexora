import re
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

RETAIL_SYNONYMS = {
    "order_id": ["order_id", "order id", "orderid", "id", "order_number", "order number", "order no", "reference"],
    "order_date": ["order_date", "order date", "date", "orderdate", "transaction_date", "transaction date", "purchase_date", "purchase date", "tx date", "tx_date"],
    "customer_id": ["customer_id", "customer id", "customerid", "cust_id", "cust id", "client_id", "client id", "user_id", "customer ref", "customer_ref"],
    "product_id": ["product_id", "product id", "productid", "item_id", "item id", "sku", "item code", "item_code"],
    "product_name": ["product_name", "product name", "item_name", "item name", "name", "title"],
    "category": ["category", "cat", "product_category", "product category", "department"],
    "sub_category": ["sub_category", "sub category", "subcategory", "sub-category"],
    "region": ["region", "territory", "zone", "location", "area"],
    "quantity": ["quantity", "qty", "units", "count", "item count", "item_count", "items"],
    "unit_price": ["unit_price", "unit price", "price", "selling_price", "selling price", "unitprice", "rate"],
    "unit_cost": ["unit_cost", "unit cost", "cost", "cogs"],
    "discount": ["discount", "disc", "discount_rate", "discount rate", "rebate", "discount pct", "discount_pct"],
    "sales": ["sales", "revenue", "total_sales", "total sales", "amount", "total_amount", "total amount", "gross_sales"],
    "profit": ["profit", "net_profit", "net profit", "margin", "margin_amount", "margin amount", "income"],
    "order_status": ["order_status", "order status", "status", "delivery_status", "delivery status", "state"]
}

BANKING_SYNONYMS = {
    "transaction_id": ["transaction_id", "transaction id", "txn_id", "txn id", "trans_id", "reference_id", "tx_id", "id", "order_id"],
    "transaction_date": ["transaction_date", "transaction date", "txn_date", "txn date", "date", "timestamp", "order_date"],
    "account_id": ["account_id", "account id", "account", "acct_no", "account_number", "account number"],
    "customer_id": ["customer_id", "customer id", "customerid", "client_id", "client id", "user_id"],
    "transaction_type": ["transaction_type", "transaction type", "txn_type", "type", "operation", "payment_type", "category"],
    "amount": ["amount", "transaction_amount", "transaction amount", "value", "txn_amount", "sales"],
    "is_fraud": ["is_fraud", "is fraud", "fraud", "fraudulent", "fraud_flag", "flagged"],
    "risk_score": ["risk_score", "risk score", "fraud_score", "fraud score", "risk"],
    "is_default": ["is_default", "is default", "default", "defaulted", "delinquent", "default_rate", "loan_default"],
    "channel": ["channel", "txn_channel", "payment_channel", "platform", "method"]
}

MANUFACTURING_SYNONYMS = {
    "batch_id": ["batch_id", "batch id", "lot_id", "lot id", "job_id", "job id", "work_order", "work order", "batch", "id"],
    "production_date": ["production_date", "production date", "batch_date", "date", "order_date"],
    "work_center": ["work_center", "work center", "line", "line_id", "machine_id", "station", "plant_line", "region"],
    "product_code": ["product_code", "product code", "item_code", "sku", "part_number", "product", "product_id"],
    "planned_quantity": ["planned_quantity", "planned quantity", "target_quantity", "planned_units", "plan", "target"],
    "produced_quantity": ["produced_quantity", "produced quantity", "units_produced", "units produced", "actual_quantity", "volume", "production_volume", "quantity"],
    "defective_quantity": ["defective_quantity", "defective quantity", "defects", "defective_units", "scrap", "scrap_units", "rejects"],
    "downtime_minutes": ["downtime_minutes", "downtime minutes", "downtime", "delay_minutes", "lost_time_minutes", "lost_time"],
    "efficiency_pct": ["efficiency_pct", "efficiency pct", "efficiency", "oee", "yield", "efficiency_percentage"],
    "shift": ["shift", "work_shift", "operating_shift"]
}

def auto_detect_column_mapping(columns: List[str], industry: str = "RETAIL") -> Dict[str, str]:
    """
    Intelligently maps raw dataset column headers to canonical schema fields based on industry priority.
    """
    mapping: Dict[str, str] = {}
    normalized_cols = {col: re.sub(r"[_\s\-\.]+", " ", col.strip().lower()) for col in columns}

    ind_upper = (industry or "RETAIL").upper()
    if ind_upper.startswith("BANK"):
        synonym_sets = [BANKING_SYNONYMS, RETAIL_SYNONYMS, MANUFACTURING_SYNONYMS]
    elif ind_upper.startswith("MANUF"):
        synonym_sets = [MANUFACTURING_SYNONYMS, RETAIL_SYNONYMS, BANKING_SYNONYMS]
    else:
        synonym_sets = [RETAIL_SYNONYMS, BANKING_SYNONYMS, MANUFACTURING_SYNONYMS]

    for syn_dict in synonym_sets:
        for canonical, synonyms in syn_dict.items():
            for orig_col, norm_col in normalized_cols.items():
                if orig_col not in mapping and norm_col in synonyms:
                    mapping[orig_col] = canonical

    return mapping

def clean_and_transform_dataframe(df: pd.DataFrame, column_mapping: Dict[str, str]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    clean_df = df.copy()
    clean_df = clean_df.rename(columns=column_mapping)
    
    audit = {
        "initial_rows": len(clean_df),
        "dropped_rows": 0,
        "coerced_numeric": [],
        "imputed_sales": 0
    }

    # Normalize string columns
    str_cols = clean_df.select_dtypes(include=["object"]).columns
    for c in str_cols:
        clean_df[c] = clean_df[c].astype(str).str.strip()

    # Clean numeric fields (removing '$', ',', '%')
    numeric_targets = [
        "quantity", "unit_price", "unit_cost", "discount", "sales", "profit",
        "amount", "risk_score",
        "planned_quantity", "produced_quantity", "defective_quantity", "downtime_minutes", "efficiency_pct"
    ]
    for num_col in numeric_targets:
        if num_col in clean_df.columns:
            cleaned_series = (
                clean_df[num_col]
                .astype(str)
                .str.replace("$", "", regex=False)
                .str.replace(",", "", regex=False)
                .str.replace("%", "", regex=False)
                .str.strip()
            )
            clean_df[num_col] = pd.to_numeric(cleaned_series, errors="coerce")
            audit["coerced_numeric"].append(num_col)

    # Defaults for retail
    if "discount" in clean_df.columns:
        clean_df["discount"] = clean_df["discount"].fillna(0.0)
    if "quantity" in clean_df.columns:
        clean_df["quantity"] = clean_df["quantity"].fillna(1).clip(lower=1).astype(int)

    # Defaults for manufacturing
    if "produced_quantity" in clean_df.columns:
        clean_df["produced_quantity"] = clean_df["produced_quantity"].fillna(0).astype(int)
    if "defective_quantity" in clean_df.columns:
        clean_df["defective_quantity"] = clean_df["defective_quantity"].fillna(0).astype(int)
    if "downtime_minutes" in clean_df.columns:
        clean_df["downtime_minutes"] = clean_df["downtime_minutes"].fillna(0).astype(int)

    # Derive sales if missing in retail
    if "sales" in clean_df.columns and "unit_price" in clean_df.columns and "quantity" in clean_df.columns:
        missing_sales = clean_df["sales"].isnull()
        if missing_sales.sum() > 0:
            clean_df.loc[missing_sales, "sales"] = (
                clean_df.loc[missing_sales, "quantity"] *
                clean_df.loc[missing_sales, "unit_price"] *
                (1.0 - clean_df.loc[missing_sales, "discount"].fillna(0.0))
            ).round(2)
            audit["imputed_sales"] = int(missing_sales.sum())

    # Date parsing
    for date_field in ["order_date", "transaction_date", "production_date"]:
        if date_field in clean_df.columns:
            clean_df[date_field] = pd.to_datetime(clean_df[date_field], errors="coerce").dt.strftime("%Y-%m-%d")

    audit["final_rows"] = len(clean_df)
    return clean_df, audit
