# NEXORA — AI Analyst Intelligence Platform
> *"Turning Enterprise Data into Intelligent Business Decisions."*

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ed.svg)](https://www.docker.com/)

---

## 1. Executive Summary

**NEXORA** is a full-stack, enterprise-grade AI Analyst Intelligence Platform tailored for retail and e-commerce enterprises. It transforms raw transactional and operational datasets into empirical business insights, predictive forecasts, scenario simulations, and prescriptive operational recommendations.

Designed from first principles to act as an autonomous analytics department, NEXORA adheres strictly to the rule: **Analytics correctness over visual appearance**. Business numbers are never hallucinated by LLMs; all figures, variances, confidence intervals, and drivers originate from validated mathematical and statistical computations performed by a dedicated Python analytics engine.

---

## 2. Core Analytical Pillars

| Dimension | Analytical Question | Implemented Engine & Methodology |
| :--- | :--- | :--- |
| **Descriptive** | *What happened?* | Exact KPI computation: Revenue $\sum(\text{sales})$, Profit $\sum(\text{profit})$, Margin %, AOV, Units Sold, Return Rate %, Customer Segmentation, Time-Series trends. |
| **Diagnostic** | *Why did it happen?* | Signature Multi-Dimensional Variance Decomposition: Decomposing $\Delta\text{Revenue} = \text{Volume Effect} + \text{AOV Effect} + \text{Interaction Effect}$ and ranking dimensional drag across Geography, Category, and SKUs. |
| **Predictive** | *What is likely to happen next?* | Time-series daily sales forecasting evaluated with chronological 80/20 train/test holdouts (Naive vs Moving Average vs Holt-Winters Exponential Smoothing) with 95% confidence envelopes and MAE/RMSE/WAPE metrics. |
| **Prescriptive** | *What should the business do?* | What-if scenario simulator with price elasticity of demand ($e=-1.2$) and diminishing marketing returns ($e_m=0.25$), accompanied by prioritized operational action plans. |

---

## 3. System Architecture

```
                       +---------------------------------------+
                       |        React 19 + TypeScript          |
                       |       Tailwind CSS + Recharts         |
                       |        (Port 3000 / SPA)              |
                       +---------------------------------------+
                                          |
                                          | REST APIs / JSON
                                          v
                       +---------------------------------------+
                       |       Java 17 Spring Boot 3           |
                       |   Data Ingestion, Schema Mapping,     |
                       |   Multi-Tenant Isolation, RestTemplate|
                       |        (Port 8080 / Backend)          |
                       +---------------------------------------+
                                     /         \
                 JPA / Hibernate    /           \  HTTP Micro-call (Timeouts: 5s/25s)
                                   v             v
       +-------------------------------+   +---------------------------------------+
       |   MySQL 8 / H2 Database       |   |       Python 3.11+ FastAPI            |
       | Orders, Products, Customers,  |   | Statsmodels, Scikit-learn, Pandas,    |
       | Inventory, Marketing, Snapshots|  | Root-Cause, Forecasting, Simulation   |
       +-------------------------------+   |        (Port 8000 / Engine)           |
                                           +---------------------------------------+
                                                               |
                                                               | Controlled Grounded Tool Calling
                                                               v
                                           +---------------------------------------+
                                           |        Google Gemini 2.5 API          |
                                           |     (With Deterministic Fallback)     |
                                           +---------------------------------------+
```

---

## 4. Key Functional Modules

1. **Executive Overview Dashboard**: Consolidated enterprise health with period-over-period delta comparisons, revenue trajectory, profit margins, geographic distribution, and top product drivers.
2. **Sales Analytics**: Daily and monthly granularity, average ticket size tracking, regional fulfillment breakdown, and discount tier margin dilution analysis ($0\%$, $1\text{--}10\%$, $11\text{--}20\%$, $>20\%$).
3. **Product Intelligence**: Profitability rankings, lowest-margin SKUs, declining product alerts, margin trap identification, and Pareto 80/20 revenue concentration gauge.
4. **Customer Analytics**: Multi-tier customer segmentation (Consumer, Corporate, Small Business), repeat purchase rate gauge, order frequency brackets, and high-value customer accounts.
5. **Inventory Intelligence**: Real-time 30-day burn rate velocity, estimated days of buffer coverage, critical stockout emergency alerts, and automated purchase order replenishment recommendations.
6. **AI Insights & Root Cause Analysis**: Signature variance decomposition breaking top-line changes into volume and price effects, ranking regional drag, and delivering prioritized operational directives.
7. **Predictive Forecasting**: 30-day forward projections with shaded 95% confidence intervals, chronological cross-validation, and MAE/RMSE/WAPE accuracy scores.
8. **What-If Scenario Simulator**: Interactive scenario modeling with sliders for price changes, discount shifts, marketing spend adjustments, organic volume shocks, and COGS inflation with economic elasticity.
9. **Guided Data Management & Ingestion**: Drag-and-drop CSV and Excel XLSX ingestion, automated canonical column mapping, 100-point data quality scorecard, anomaly warnings, and dataset version history audit.
10. **Conversational AI Analyst Copilot**: Grounded assistant that parses intent, invokes controlled analytical tools (`get_revenue_summary`, `get_root_cause_analysis`, `get_forecast`, `get_inventory_risks`), and returns executive answers without hallucinations.

---

## 5. Quickstart & Local Execution

### Prerequisites
- Java 17+ & Maven 3.9+
- Python 3.11+
- Node.js 20+ & npm

### Step 1: Start Python Analytics Engine
```bash
# In project root
python3 -m venv analytics-service/venv
./analytics-service/venv/bin/pip install -r analytics-service/requirements.txt
PYTHONPATH=analytics-service ./analytics-service/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 2: Start Spring Boot Backend
```bash
cd backend
mvn clean spring-boot:run
# Backend initializes demo dataset automatically and serves on http://localhost:8080
```

### Step 3: Start React Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### Step 4: Access the Application
Open your browser to: **`http://localhost:3000`**
- Swagger API Docs: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- Python Analytics Health: `http://localhost:8000/health`

---

## 6. Docker Compose Deployment

To run all four services (MySQL, Python Analytics Engine, Spring Boot Backend, Nginx Frontend) in Docker:
```bash
docker compose up --build
```
Access the application at `http://localhost:3000`.

---

## 7. Automated Test Suite Execution

### Python Analytics Tests
```bash
PYTHONPATH=analytics-service ./analytics-service/venv/bin/pytest analytics-service/tests
```
*Tests KPI calculations, duplicate detection, IQR anomaly scoring, variance decomposition, and forecasting.*

### Java Spring Boot Tests
```bash
cd backend && mvn test
```
*Tests application context loading, service boundaries, data ingestion, and API response encapsulation.*

### Frontend Production Build Test
```bash
cd frontend && npm run build
```
*Compiles TypeScript and bundles assets with Vite.*

---

## 8. Documentation Sitemap

- [System Architecture](file:///Users/lucky/Downloads/nexora/docs/ARCHITECTURE.md)
- [Database Schema & Migrations](file:///Users/lucky/Downloads/nexora/docs/DATABASE_DESIGN.md)
- [Analytics Methodology & Formulas](file:///Users/lucky/Downloads/nexora/docs/ANALYTICS_METHODOLOGY.md)
- [Data Ingestion & Quality Pipeline](file:///Users/lucky/Downloads/nexora/docs/DATA_PIPELINE.md)
- [AI & Copilot Grounding Architecture](file:///Users/lucky/Downloads/nexora/docs/AI_ARCHITECTURE.md)
- [Demonstration Walkthrough Guide](file:///Users/lucky/Downloads/nexora/docs/DEMO_GUIDE.md)
- [Senior Interview Preparation & Defense](file:///Users/lucky/Downloads/nexora/docs/INTERVIEW_PREPARATION.md)
