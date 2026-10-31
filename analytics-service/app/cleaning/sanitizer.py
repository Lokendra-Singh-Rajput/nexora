import re
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

CANONICAL_SYNONYMS = {
    "order_id": ["order_id", "order id", "orderid", "id", "order_number", "order number", "order no", "transaction_id", "transaction id"],
    "order_date": ["order_date", "order date", "date", "orderdate", "transaction_date", "transaction date", "purchase_date", "purchase date"],
    "customer_id": ["customer_id", "customer id", "customerid", "cust_id", "cust id", "client_id", "client id", "user_id"],
    "product_id": ["product_id", "product id", "productid", "item_id", "item id", "sku"],
    "product_name": ["product_name", "product name", "item_name", "item name", "name", "title"],
    "category": ["category", "cat", "product_category", "product category", "department"],
    "sub_category": ["sub_category", "sub category", "subcategory", "sub-category"],
    "region": ["region", "territory", "zone", "location", "area"],
    "quantity": ["quantity", "qty", "units", "count", "item count", "item_count", "items"],
    "unit_price": ["unit_price", "unit price", "price", "selling_price", "selling price", "unitprice", "rate"],
    "unit_cost": ["unit_cost", "unit cost", "cost", "cogs"],
    "discount": ["discount", "disc", "discount_rate", "discount rate", "rebate"],
    "sales": ["sales", "revenue", "total_sales", "total sales", "amount", "total_amount", "total amount", "gross_sales"],
    "profit": ["profit", "net_profit", "net profit", "margin_amount", "margin amount", "income"],
    "order_status": ["order_status", "order status", "status", "delivery_status", "delivery status", "state"]
}

def auto_detect_column_mapping(columns: List[str]) -> Dict[str, str]:
    """
    Intelligently maps raw dataset column headers to canonical schema fields.
    """
    mapping: Dict[str, str] = {}
    normalized_cols = {col: re.sub(r"[_\s\-\.]+", " ", col.strip().lower()) for col in columns}

    for canonical, synonyms in CANONICAL_SYNONYMS.items():
        for orig_col, norm_col in normalized_cols.items():
            if norm_col in synonyms:
                mapping[orig_col] = canonical
                break
    return mapping

def clean_and_transform_dataframe(df: pd.DataFrame, column_mapping: Dict[str, str]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans, maps, type-coerces and transforms incoming business data.
    """
    clean_df = df.copy()
    
    # Rename columns based on verified mapping
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
    for num_col in ["quantity", "unit_price", "unit_cost", "discount", "sales", "profit"]:
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

    # Defaults
    if "discount" in clean_df.columns:
        clean_df["discount"] = clean_df["discount"].fillna(0.0)

    # Quantity validation
    if "quantity" in clean_df.columns:
        clean_df["quantity"] = clean_df["quantity"].fillna(1).clip(lower=1).astype(int)

    # Derive sales if missing
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
    if "order_date" in clean_df.columns:
        clean_df["order_date"] = pd.to_datetime(clean_df["order_date"], errors="coerce").dt.strftime("%Y-%m-%d")
        # Drop rows with invalid dates
        initial_len = len(clean_df)
        clean_df = clean_df.dropna(subset=["order_date"])
        audit["dropped_rows"] += initial_len - len(clean_df)

    audit["final_rows"] = len(clean_df)
    return clean_df, audit
