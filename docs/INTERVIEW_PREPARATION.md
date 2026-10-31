# NEXORA — Senior Engineering & Analytics Interview Preparation
**Document ID: NEX-INTV-2026**

---

## 1. Top 20 Technical & Analytical Interview Questions

### Q1: What is the business problem NEXORA solves?
**Answer**: Modern business intelligence tools (Tableau, Power BI) are passive display dashboards that show *what* happened but do not explain *why* it happened or *what to do next*. Conversely, generic AI chatbots hallucinate numbers when asked business questions. NEXORA bridges this gap: it functions as an autonomous analytics department by performing deterministic descriptive computations, multi-dimensional root-cause variance decomposition, out-of-sample forecasting, what-if simulations with economic elasticity, and grounded AI decision support.

---

### Q2: Walk me through the high-level system architecture. Why separate Spring Boot and Python?
**Answer**: NEXORA uses a decoupled service-oriented architecture:
- **Java 17 Spring Boot 3**: Orchestrator, data ingestion (CSV/XLSX parsing), multi-tenant company isolation, relational persistence (MySQL 8 / JPA), and API gateway.
- **Python 3.11 FastAPI**: Dedicated mathematical and statistical computing engine using Pandas, NumPy, Scikit-learn, and Statsmodels.
- **Why separate them?** Java excels at robust multi-threaded server orchestration, transactional data integrity, and enterprise integration. Python is the unmatched standard for vectorized matrix calculations, time-series forecasting, and scientific data profiling. Coupling them via lightweight REST micro-calls with strict timeouts provides the best of both ecosystems without unnecessary distributed infrastructure like Kafka or Kubernetes.

---

### Q3: How do you prevent the AI Copilot from hallucinating numbers?
**Answer**: The AI model is strictly prohibited from generating SQL queries against the database or generating metrics from memory. We implement a **Controlled Tool Calling Retrieval Pattern**:
1. User questions are mapped to predefined analytical tool signatures (`get_revenue_summary`, `get_root_cause_analysis`, `get_forecast`, `get_inventory_risks`).
2. The Python analytics engine computes the exact figures deterministically from transactional records.
3. The LLM receives the verified JSON output and is instructed via prompt conditioning to act exclusively as an executive communicator, explaining the validated metrics.
4. If the Gemini API is unreachable, a deterministic rules engine formats the response identically.

---

### Q4: Explain the mathematical formula behind your Root Cause Analysis engine.
**Answer**: We implement exact three-factor variance decomposition for top-line revenue:
$$\text{Revenue} = \text{Volume} \times \text{AOV}$$
The total change between the current period ($t$) and baseline period ($t-1$) decomposes into:
$$\Delta \text{Revenue} = (\Delta V \times A_{t-1}) + (V_{t-1} \times \Delta A) + (\Delta V \times \Delta A)$$
Where:
- $\Delta V \times A_{t-1}$ is the **Order Volume Effect** (impact of customer acquisition/retention).
- $V_{t-1} \times \Delta A$ is the **AOV/Pricing Effect** (impact of ticket size and pricing).
- $\Delta V \times \Delta A$ is the **Interaction Effect**.
This ensures that the component effects sum identically to $\Delta \text{Revenue}$ without mathematical error.

---

### Q5: How do you calculate dimensional contribution to revenue change?
**Answer**: For each partition $d$ within dimension $D$ (such as Region or Category):
$$\Delta \text{Sales}(d) = \text{Sales}_{\text{cur}}(d) - \text{Sales}_{\text{prev}}(d)$$
$$\text{Contribution}(d) = \left( \frac{\Delta \text{Sales}(d)}{\Delta \text{Revenue}} \right) \times 100$$
By sorting by absolute delta ascending, we immediately isolate the primary dragging territories or categories causing top-line contraction.

---

### Q6: How is your forecasting model trained and evaluated? Why avoid random train/test splits?
**Answer**: Time series data exhibits temporal autocorrelation, seasonality, and trend. Using random splits causes **lookahead leakage**, where future data points inform predictions of past events, yielding falsely optimistic accuracy. We use strict **chronological splitting**: the first 80% of days form the training set, and the final 20% form the out-of-sample holdout test partition. We evaluate Naive, Moving Average, and Holt-Winters Exponential Smoothing models, selecting the winner based on holdout MAE before refitting on full history.

---

### Q7: Why did you choose WAPE over MAPE in forecast evaluation?
**Answer**: Mean Absolute Percentage Error (MAPE) divides by actual sales:
$$\text{MAPE} = \frac{1}{n} \sum \frac{|y_t - \hat{y}_t|}{y_t}$$
When daily sales are zero or close to zero, MAPE explodes toward infinity or triggers division-by-zero errors. Weighted Absolute Percentage Error (WAPE) divides the sum of absolute errors by the sum of actuals:
$$\text{WAPE} = \frac{\sum |y_t - \hat{y}_t|}{\sum y_t} \times 100$$
WAPE is stable, interpretable, and mathematically sound across sparse retail time series.

---

### Q8: How does your What-If Scenario Simulator handle price elasticity?
**Answer**: A naive simulator assumes that raising prices by 10% increases revenue by 10% with static unit sales. In real retail economics, demand is elastic. Our simulator models price elasticity of demand:
$$\text{Volume Multiplier} = 1.0 + \left( e_p \times \frac{\Delta P}{P} \right)$$
Using $e_p = -1.2$ for retail, a $+10\%$ price increase contracts demand volume by $12\%$. We also model logarithmic diminishing returns on marketing expenditure ($e_m = 0.25$). This produces realistic hypothetical outcomes for decision support.

---

### Q9: What is your Data Quality Score formula and how is it derived?
**Answer**: The 100-point Data Quality Score is computed in `app/profiling/quality.py`:
$$\text{Score} = \max\left(0, \min\left(100, 100 - (30 \cdot r_{\text{missing}} + 40 \cdot r_{\text{invalid}} + 20 \cdot r_{\text{duplicate}} + 10 \cdot r_{\text{outlier}})\right)\right)$$
Weights reflect business risk: invalid data (negative prices/dates) has the highest penalty (40%), missing values (30%), duplicates (20%), and statistical outliers beyond $2.5 \times \text{IQR}$ (10%).

---

### Q10: How does the system handle schema heterogeneity during file uploads?
**Answer**: In `app/cleaning/sanitizer.py`, we implement automated canonical synonym mapping. We normalize incoming column names (removing underscores, spaces, hyphens, and lowercase casing) and match against dictionaries of common synonyms (`order_number` $\rightarrow$ `order_id`, `selling_price` $\rightarrow$ `unit_price`, `cogs` $\rightarrow$ `unit_cost`). The mapped fields are confirmed by the user and coerced to standard types.

---

### Q11: How do you handle database versioning and avoid stale dashboard cache?
**Answer**: Each upload creates an immutable `Dataset` record with an incremented version number (`version: 1`, `version: 2`). When new data is persisted, the Spring Boot API returns the new dataset version. The React frontend maintains a refresh trigger counter that invalidates client-side state and fetches newly aggregated metrics from the database immediately.

---

### Q12: How do you identify "Revenue Traps" in product intelligence?
**Answer**: A "Revenue Trap" is an SKU with high gross sales volume but disproportionately low profit margin. In `app/products/product_intelligence.py`, we identify products sitting in the **top 40th percentile of revenue** whose profit margin falls into the **bottom 30th percentile**. These products create false confidence on sales dashboards while draining warehouse capital and operational bandwidth.

---

### Q13: What statistical techniques do you use for anomaly detection?
**Answer**: We combine two interpretable statistical methods:
1. **Rolling 14-Day Z-Score**: $Z_t = \frac{y_t - \mu_{14}}{\sigma_{14}}$. Points with $|Z| \ge 2.3$ are flagged as anomalies.
2. **Interquartile Range (IQR)**: Used for profit margin compression. If a day's margin falls below $Q_1 - 1.5 \times \text{IQR}$, it is flagged as margin erosion.
These methods were chosen over black-box isolation forests because their baselines and deviations are transparent and explainable to business executives.

---

### Q14: How does the inventory engine calculate days of remaining stock and reorder quantities?
**Answer**:
1. It calculates the product's recent 30-day sales velocity: $\text{Daily Demand} = \frac{\sum_{30\text{d}} \text{quantity}}{30}$.
2. Days remaining: $\frac{\text{Stock Quantity}}{\text{Daily Demand}}$.
3. Reorder recommendation: Targets 45 days of safety coverage plus supplier lead time:
   $$\text{Order Qty} = \max\left(0, \, \lceil (45 + \text{Lead Time}) \times \text{Daily Demand} - \text{Stock Quantity} \rceil\right)$$

---

### Q15: How is multi-tenancy handled in the database schema?
**Answer**: Multi-tenancy is enforced at the schema and query layer through shared-database, shared-schema tenant isolation. Every table (`datasets`, `orders`, `products`, `customers`, `inventory`, `marketing`) has an indexed `company_id` column. The Spring Data JPA repository layer filters every query by `company_id`.

---

### Q16: How do you handle financial precision in the Java and database layers?
**Answer**: We strictly avoid `float` and `double` for monetary values. In Java, all prices, revenues, and profits use `java.math.BigDecimal` with explicit `RoundingMode.HALF_UP`. In MySQL, they are stored as `DECIMAL(12, 2)`. This prevents IEEE-754 binary floating-point representation errors.

---

### Q17: What was an engineering trade-off you made in this architecture?
**Answer**: We considered introducing Apache Kafka for asynchronous ingestion and Redis for caching. However, for an analytics product serving SMB to mid-market enterprise workloads (hundreds of thousands of rows per company), adding distributed message brokers and in-memory caches introduces operational overhead, network latency, and cache invalidation complexity. We opted for direct Spring Boot ingestion with transactional JPA batch persistence and REST micro-calls to FastAPI. This achieved sub-second query latency and robust reliability with zero unnecessary infrastructure.

---

### Q18: What is Pareto concentration in Product Intelligence and how is it computed?
**Answer**: The Pareto principle (80/20 rule) measures revenue concentration. We sort all SKUs by revenue descending, compute cumulative percentage shares, and measure the revenue share produced by the top 20% of catalog SKUs. In our NovaMart dataset, the top 20% of products generate ~48% of total sales, alerting executives to high SKU dependency.

---

### Q19: What happens if the Python analytics service is unreachable?
**Answer**: Spring Boot encapsulates calls in `AnalyticsOrchestrationService` with strict timeouts (5s connect, 25s read). If the service times out or throws an exception, Spring Boot logs the error, catches the exception, and returns a controlled empty or cached response wrapped in our standard `ApiResponse<T>` envelope. The React UI displays an `ErrorBanner` with a retry button without crashing the application.

---

### Q20: What are the current limitations and future scalability roadmap?
**Answer**:
1. **Current Limitations**: Time series models currently forecast univariate daily revenue; external macroeconomic indicators (inflation, competitor pricing) are not yet integrated into the model.
2. **Scalability Roadmap**: For datasets exceeding 50 million rows, transition the ingestion worker to Apache Arrow/Polars or ClickHouse for OLAP column-store aggregation, and introduce Celery/Redis for long-running asynchronous background training.
