# NEXORA — Data Pipeline & Ingestion Architecture
**Document ID: NEX-PIPE-2026**

---

## 1. Guided Ingestion Pipeline Overview

The NEXORA Data Ingestion Engine is engineered to accept messy, real-world tabular data from enterprise users, sanitize it, validate schema constraints, generate an auditable Data Quality Report, and atomically persist records.

```
+---------------+      +-------------------+      +--------------------+
|  CSV or XLSX  | ---> |   Apache POI /    | ---> | Python Profiling   |
|  File Upload  |      |   Commons CSV     |      | /profile Endpoint  |
+---------------+      +-------------------+      +--------------------+
                                                             |
                               +-----------------------------+
                               |
                               v
               +-------------------------------+
               | 1. Synonym Column Mapping     |
               | 2. Quality Scorecard Formula  |
               | 3. Type Coercion & Imputation |
               +-------------------------------+
                               |
                               v
               +-------------------------------+
               | Transactional DB Persistence  |
               | (Dataset Version Invalidation)|
               +-------------------------------+
                               |
                               v
               +-------------------------------+
               | Dynamic Dashboard Refresh     |
               +-------------------------------+
```

---

## 2. Automated Schema Detection & Column Synonym Mapping

Incoming files often use non-standard column headers. NEXORA automatically recognizes the following synonyms and maps them to the canonical data model:

| Canonical Field | Recognized Synonyms | Target Data Type |
| :--- | :--- | :--- |
| `order_id` | `order id`, `order_number`, `order no`, `transaction_id`, `id` | VARCHAR(64) |
| `order_date` | `order date`, `date`, `transaction_date`, `purchase_date` | DATE (YYYY-MM-DD) |
| `customer_id` | `customer id`, `cust_id`, `client_id`, `user_id` | VARCHAR(64) |
| `product_id` | `product id`, `item_id`, `sku` | VARCHAR(64) |
| `quantity` | `qty`, `units`, `count`, `item count`, `items` | INT ($\ge 1$) |
| `unit_price` | `unit price`, `selling_price`, `price`, `rate` | DECIMAL(12, 2) |
| `discount` | `disc`, `discount_rate`, `rebate` | DECIMAL(5, 4) |
| `sales` | `revenue`, `total_sales`, `amount`, `gross_sales` | DECIMAL(12, 2) |
| `profit` | `net_profit`, `margin_amount`, `income` | DECIMAL(12, 2) |
| `region` | `territory`, `zone`, `location`, `area` | VARCHAR(64) |
| `order_status`| `status`, `delivery_status`, `state` | VARCHAR(50) |

---

## 3. Data Quality Scoring Formula

Every uploaded dataset is scored on a standardized 0 to 100 scale using the following formula:

$$\text{Quality Score} = \max\left(0.0, \, \min\left(100.0, \, 100 - (30 \cdot r_{\text{missing}} + 40 \cdot r_{\text{invalid}} + 20 \cdot r_{\text{duplicate}} + 10 \cdot r_{\text{outlier}})\right)\right)$$

Where:
- $r_{\text{missing}}$: Ratio of null/empty cells to total expected matrix cells.
- $r_{\text{invalid}}$: Ratio of unparseable rows (invalid dates, negative quantities, corrupted numbers) to total rows.
- $r_{\text{duplicate}}$: Ratio of duplicate order records to total rows.
- $r_{\text{outlier}}$: Ratio of numerical entries exceeding $2.5 \times \text{IQR}$ bounds.

A score above $85.0$ qualifies as a high-integrity enterprise dataset.

---

## 4. Cleaning & Transformation Safeguards

1. **Currency Stripping**: Numerical parsers automatically clean currency symbols (`$`, `€`, `£`), thousand commas (`,`), and percentage signs (`%`).
2. **Sales Auto-Derivation**: If the `sales` column is absent or null, it is deterministically computed as:
   $$\text{sales} = \text{quantity} \times \text{unit\_price} \times (1.0 - \text{discount})$$
3. **Invalid Date Rejection**: Orders with unparseable dates are logged and excluded from time-series indexing.
4. **Controlled Replace vs Append**: The user can toggle `replaceExisting=true` to replace earlier company records or append to historical sequences.
