from typing import Dict, Any, List
import pandas as pd
import numpy as np

def generate_quality_report(df: pd.DataFrame, table_type: str = "orders") -> Dict[str, Any]:
    """
    Evaluates dataset quality and integrity.
    Quality Score Formula:
      Score = max(0, min(100, 100 - (missing_ratio * 30 + invalid_ratio * 40 + duplicate_ratio * 20 + outlier_ratio * 10)))
    """
    if df is None or df.empty:
        return {
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "quality_score": 0.0,
            "duplicate_rows": 0,
            "missing_values": {},
            "anomalies": [],
            "warnings": ["Dataset is empty."],
            "column_profiles": {}
        }

    total_rows = len(df)
    duplicates = int(df.duplicated().sum())
    duplicate_ratio = duplicates / total_rows if total_rows > 0 else 0.0

    missing_counts = df.isnull().sum().to_dict()
    total_missing_cells = sum(missing_counts.values())
    total_cells = total_rows * len(df.columns)
    missing_ratio = total_missing_cells / total_cells if total_cells > 0 else 0.0

    invalid_rows_set = set(df[df.duplicated()].index)
    warnings: List[str] = []
    anomalies: List[Dict[str, Any]] = []

    # Map column headers to canonical names to inspect domain constraints
    from app.cleaning.sanitizer import auto_detect_column_mapping
    detected_map = auto_detect_column_mapping(list(df.columns))
    df_eval = df.rename(columns=detected_map)

    # Specific business domain checks
    if "quantity" in df_eval.columns:
        qty_numeric = pd.to_numeric(df_eval["quantity"].astype(str).str.replace(r"[^\d.-]", "", regex=True), errors="coerce")
        neg_qty = df_eval[qty_numeric < 0]
        if not neg_qty.empty:
            for idx in neg_qty.index:
                invalid_rows_set.add(idx)
            orig_col = [k for k, v in detected_map.items() if v == "quantity"]
            col_name = orig_col[0] if orig_col else "quantity"
            warnings.append(f"Found {len(neg_qty)} rows with negative quantity.")
            anomalies.append({
                "type": "negative_value",
                "column": col_name,
                "count": len(neg_qty),
                "severity": "HIGH",
                "message": "Quantities must be positive integers."
            })

    if "sales" in df_eval.columns:
        sales_numeric = pd.to_numeric(df_eval["sales"].astype(str).str.replace(r"[^\d.-]", "", regex=True), errors="coerce")
        neg_sales = df_eval[sales_numeric < 0]
        if not neg_sales.empty:
            for idx in neg_sales.index:
                invalid_rows_set.add(idx)
            orig_col = [k for k, v in detected_map.items() if v == "sales"]
            col_name = orig_col[0] if orig_col else "sales"
            warnings.append(f"Found {len(neg_sales)} rows with negative sales.")
            anomalies.append({
                "type": "negative_value",
                "column": col_name,
                "count": len(neg_sales),
                "severity": "HIGH",
                "message": "Sales values should not be negative."
            })

    if "order_date" in df_eval.columns:
        # Check invalid dates
        parsed_dates = pd.to_datetime(df_eval["order_date"], errors="coerce")
        invalid_dates = parsed_dates.isnull().sum() - df_eval["order_date"].isnull().sum()
        if invalid_dates > 0:
            orig_col = [k for k, v in detected_map.items() if v == "order_date"]
            col_name = orig_col[0] if orig_col else "order_date"
            warnings.append(f"Found {invalid_dates} unparseable order dates.")
            anomalies.append({
                "type": "invalid_date_format",
                "column": col_name,
                "count": int(invalid_dates),
                "severity": "HIGH",
                "message": "Dates could not be parsed into ISO YYYY-MM-DD standard."
            })

    # Outlier detection using IQR on numerical columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outlier_count = 0
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        if iqr > 0:
            lower = q1 - 2.5 * iqr
            upper = q3 + 2.5 * iqr
            col_outliers = df[(df[col] < lower) | (df[col] > upper)]
            outlier_count += len(col_outliers)
            if len(col_outliers) > 0:
                anomalies.append({
                    "type": "statistical_outlier",
                    "column": col,
                    "count": len(col_outliers),
                    "severity": "MEDIUM",
                    "message": f"Identified {len(col_outliers)} values beyond 2.5x IQR [{round(lower, 2)}, {round(upper, 2)}]."
                })

    outlier_ratio = min(1.0, outlier_count / (total_rows * len(numeric_cols))) if len(numeric_cols) > 0 else 0.0
    invalid_ratio = len(invalid_rows_set) / total_rows if total_rows > 0 else 0.0

    raw_score = 100.0 - (missing_ratio * 30.0 + invalid_ratio * 40.0 + duplicate_ratio * 20.0 + outlier_ratio * 10.0)
    quality_score = max(0.0, min(100.0, raw_score))

    # Column profiles
    column_profiles = {}
    for col in df.columns:
        col_type = str(df[col].dtype)
        nunique = int(df[col].nunique())
        nulls = int(df[col].isnull().sum())
        sample_vals = df[col].dropna().head(3).tolist()
        column_profiles[col] = {
            "data_type": col_type,
            "distinct_count": nunique,
            "null_count": nulls,
            "sample_values": sample_vals
        }

    return {
        "total_rows": total_rows,
        "valid_rows": total_rows - len(invalid_rows_set),
        "invalid_rows": len(invalid_rows_set),
        "quality_score": round(quality_score, 1),
        "duplicate_rows": duplicates,
        "missing_values": missing_counts,
        "anomalies": anomalies,
        "warnings": warnings,
        "column_profiles": column_profiles
    }
