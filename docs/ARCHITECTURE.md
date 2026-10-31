# NEXORA — Architectural Design Document
**Document ID: NEX-ARCH-2026**  
**Classification: Senior Engineering Architecture**

---

## 1. Architectural Philosophy & Design Principles

NEXORA is engineered to solve a fundamental failure of modern business intelligence: **superficial dashboards that present visual charts without diagnostic rigor, paired with hallucination-prone LLMs.**

To overcome this, NEXORA implements a strict **Service-Oriented Decoupled Architecture**:

1. **Analytical Integrity over Visual Appearance**: No key performance indicator is calculated in the presentation tier. Every percentage, ratio, variance, and forecast is derived via deterministic, reproducible computations in Python.
2. **AI Grounding & Hallucination Prevention**: The conversational AI copilot never queries SQL directly and cannot invent figures. It operates solely via strict **controlled analytical tool calling**. Predefined statistical routines calculate metrics; the model synthesizes and interprets validated figures.
3. **Graceful Degradation**: If external API credentials (such as Google Gemini API keys) are not configured or network access fails, the platform degrades cleanly to a deterministic rule-based explainability engine without breaking user workflows.
4. **Clean Service Boundaries**:
   - **Frontend (Presentation Tier)**: React 19, TypeScript, Tailwind CSS, Recharts. Stateless presentation, filter state management, responsive UI.
   - **Backend Orchestrator (Application Tier)**: Java 17, Spring Boot 3, Spring Data JPA. Transactional persistence, dataset versioning, file ingestion parsing, authentication/authorization boundaries.
   - **Analytics Engine (Computation Tier)**: Python 3.11, FastAPI, Pandas, NumPy, Statsmodels, Scikit-learn. Vectorized KPI math, time-series forecasting, variance decomposition, IQR anomaly scoring.
   - **Persistence Tier**: MySQL 8 / H2 in-memory/file mode with Flyway schema migration scripts.

---

## 2. High-Level Component Interaction Diagram

```
+-----------------------------------------------------------------------------------+
|                              REACT 19 FRONTEND                                    |
|   Pages: Overview, Sales, Products, Customers, Inventory, Root Cause, Simulator   |
|   State: Date Presets, Multi-Region Filter, Copilot Drawer, Toast Notifications  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS / REST (Port 3000 -> 8080)
                                         v
+-----------------------------------------------------------------------------------+
|                        SPRING BOOT 3 ORCHESTRATION BACKEND                        |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | DatasetController  |   | AnalyticsController   |   | CopilotController      |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
|            |                          |                            |              |
|  +--------------------+   +-----------------------+                |              |
|  | IngestionService   |   | AnalyticsOrchestration|----------------+              |
|  +--------------------+   +-----------------------+                               |
|            |                          |                                           |
+------------|--------------------------|-------------------------------------------+
             |                          |
    JDBC/JPA |                 HTTP REST| (Timeouts: Connect 5s, Read 25s)
             v                          v
+-------------------------+   +-----------------------------------------------------+
|      MYSQL 8 / H2       |   |             FASTAPI PYTHON ANALYTICS                |
|  - companies            |   |                                                     |
|  - datasets (versioned) |   |  - app.metrics.kpis: SUM, COUNT(DISTINCT), Growth   |
|  - orders (indexed)     |   |  - app.root_cause.analyzer: Variance Decomposition  |
|  - products             |   |  - app.forecasting.forecaster: Exponential Smoothing|
|  - customers            |   |  - app.simulation.simulator: Price & Mkt Elasticity |
|  - inventory            |   |  - app.anomaly.detector: Rolling Z-score & IQR      |
|  - marketing            |   |  - app.copilot.analyst_copilot: Tool Dispatcher     |
+-------------------------+   +-----------------------------------------------------+
                                                        |
                                                        | HTTPS REST (Optional)
                                                        v
                                      +-----------------------------------+
                                      |      Google Gemini 2.5 API        |
                                      |   Strict Grounded JSON Synthesis  |
                                      +-----------------------------------+
```

---

## 3. Micro-Interaction Protocols

### 3.1 Data Ingestion & Refresh Workflow
1. User uploads a CSV or Excel (`.xlsx`) spreadsheet via `/api/v1/datasets/upload`.
2. Spring Boot parses raw tabular data using `Apache Commons CSV` or `Apache POI`.
3. Spring Boot posts raw samples to Python FastAPI `/api/v1/analytics/profile` for automated schema detection, column synonym matching, and IQR anomaly profiling.
4. Python returns a 100-point Data Quality Score, detected mapping, and anomaly warnings.
5. Spring Boot commits records into MySQL/H2 with an incremented dataset version identifier (`v1`, `v2`, etc.).
6. The frontend receives the ingestion confirmation and invalidates client-side cache keys, triggering an immediate recalculation of all dashboards.

### 3.2 Root Cause Variance Decomposition Workflow
1. User filters for a specific time range (or evaluates the full time series).
2. Spring Boot partitions transactions chronologically into the current evaluation window and matching prior baseline window.
3. Python Analytics receives both partitions and executes exact mathematical variance decomposition:
   $$\Delta \text{Revenue} = (\Delta \text{Volume} \times \text{AOV}_{\text{prev}}) + (\text{Volume}_{\text{prev}} \times \Delta \text{AOV}) + (\Delta \text{Volume} \times \Delta \text{AOV})$$
4. Dimensional variance is decomposed across Geography, Merchandise Department, and SKU.
5. The ranked contributors, potential causes, and operational prescriptions are returned to the client.

### 3.3 AI Copilot Query Processing
1. User submits an analytical question (e.g. *"Why did revenue decrease?"*).
2. Copilot parser matches user intent to a controlled tool signature: `get_root_cause_analysis`.
3. The underlying analytical routine executes against real transactional data.
4. If `GEMINI_API_KEY` is present, the verified JSON facts are sent to Gemini with a strict system instruction:
   *Base response strictly and exclusively on the empirical tool output. Never invent metrics.*
5. If Gemini is unavailable, the deterministic rules engine formats the executive direct answer, supporting facts, interpretation, and recommendations.

---

## 4. Failure Modes & Resilience Patterns

| Failure Scenario | Built-in Mitigation | System Outcome |
| :--- | :--- | :--- |
| **Python Service Latency / Timeout** | Spring Boot `RestTemplate` configured with 5-second connect and 25-second read timeouts. | Returns controlled `503 Service Unavailable` with friendly UI retry banner instead of hanging threads. |
| **Gemini API Outage / Quota Limit** | Try/catch block in `chat_with_copilot` falls back to `generate_rule_based_response`. | User receives instant, 100% accurate rule-based response with source badge `deterministic_rules_engine`. |
| **Corrupted Dataset Upload** | Spring Boot validates headers against canonical schema and skips unparseable records with audit logging. | Upload proceeds with partial valid rows, reports dropped rows, and adjusts quality score accordingly. |
| **Division by Zero in Metrics** | Python KPI engine protects denominators (`np.where(revenue > 0, profit / revenue, 0.0)`). | Returns `0.0` or `100.0` gracefully instead of throwing `NaN` or `ZeroDivisionError`. |
