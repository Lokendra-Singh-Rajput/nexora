# NEXORA — Analytics & Mathematical Methodology Specification
**Document ID: NEX-MATH-2026**

---

## 1. Core Key Performance Indicator (KPI) Formulas

### 1.1 Revenue & Profitability
- **Total Revenue**:
  $$\text{Revenue} = \sum_{i=1}^{N} \text{sales}_i$$
  *Implementation: `app/metrics/kpis.py`*

- **Total Profit**:
  $$\text{Profit} = \sum_{i=1}^{N} \text{profit}_i$$
  *Implementation: `app/metrics/kpis.py`*

- **Profit Margin (%)**:
  $$\text{Profit Margin} = \begin{cases} \left( \frac{\sum \text{profit}}{\sum \text{sales}} \right) \times 100, & \text{if } \sum \text{sales} > 0 \\ 0.0, & \text{otherwise} \end{cases}$$

- **Total Orders**:
  $$\text{Total Orders} = \text{COUNT}(\text{DISTINCT } \text{order\_id})$$
  *(Prevents confusing row counts with distinct customer transactions).*

- **Average Order Value (AOV)**:
  $$\text{AOV} = \begin{cases} \frac{\text{Total Revenue}}{\text{Total Orders}}, & \text{if Total Orders} > 0 \\ 0.0, & \text{otherwise} \end{cases}$$

- **Return Rate (%)**:
  $$\text{Return Rate} = \left( \frac{\text{COUNT}(\text{DISTINCT returned orders})}{\text{Total Orders}} \right) \times 100$$

### 1.2 Growth Calculations
- **Revenue Growth (%)**:
  $$\text{Growth}_{\text{rev}} = \begin{cases} \left( \frac{\text{Revenue}_{\text{cur}} - \text{Revenue}_{\text{prev}}}{\text{Revenue}_{\text{prev}}} \right) \times 100, & \text{if } \text{Revenue}_{\text{prev}} > 0 \\ 0.0, & \text{otherwise} \end{cases}$$

- **Profit Growth (%)**:
  $$\text{Growth}_{\text{profit}} = \begin{cases} \left( \frac{\text{Profit}_{\text{cur}} - \text{Profit}_{\text{prev}}}{|\text{Profit}_{\text{prev}}|} \right) \times 100, & \text{if } \text{Profit}_{\text{prev}} \neq 0 \\ 0.0, & \text{otherwise} \end{cases}$$

---

## 2. Signature Root Cause Analysis (Variance Decomposition)

When a KPI changes by $\Delta \text{Revenue} = \text{Revenue}_{\text{cur}} - \text{Revenue}_{\text{prev}}$, NEXORA executes exact three-factor variance decomposition:

$$\text{Revenue} = \text{Volume} \times \text{AOV}$$

Let:
- $\Delta V = V_{\text{cur}} - V_{\text{prev}}$ (Order Volume change)
- $\Delta A = A_{\text{cur}} - A_{\text{prev}}$ (Average Order Value change)

The total net change decomposes identically into:
$$\Delta \text{Revenue} = \underbrace{(\Delta V \times A_{\text{prev}})}_{\text{Volume Effect}} + \underbrace{(V_{\text{prev}} \times \Delta A)}_{\text{Price/AOV Effect}} + \underbrace{(\Delta V \times \Delta A)}_{\text{Interaction Effect}}$$

### Dimensional Contribution Ranking
For any dimension $D$ (e.g. Region, Category, Product) partitioned into sub-elements $d \in D$:
$$\Delta \text{Sales}(d) = \text{Sales}_{\text{cur}}(d) - \text{Sales}_{\text{prev}}(d)$$
$$\text{Contribution}(d) = \left( \frac{\Delta \text{Sales}(d)}{\Delta \text{Revenue}} \right) \times 100$$

Dimensions with the largest negative contribution are ranked as the primary drag factors driving top-line contraction.

---

## 3. Predictive Analytics & Time-Series Forecasting

### 3.1 Model Evaluation Protocol
Forecasting uses **strict chronological splitting** (first 80% train, subsequent 20% holdout test). Random cross-validation is forbidden because it introduces temporal lookahead leakage.

Three algorithms are fitted and scored on the test partition:
1. **Naive Baseline**: Projects the last observed value $\hat{y}_{t+h} = y_t$.
2. **7-Day Moving Average**: $\hat{y}_{t+h} = \frac{1}{7} \sum_{i=0}^{6} y_{t-i}$.
3. **Holt-Winters Exponential Smoothing**: Captures trend and 7-day day-of-week seasonality:
   $$\hat{y}_{t+h} = \ell_t + h b_t + s_{t+h-m(k+1)}$$

### 3.2 Error Metrics
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{n} \sum_{t=1}^{n} |y_t - \hat{y}_t|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{t=1}^{n} (y_t - \hat{y}_t)^2}$$
- **Weighted Absolute Percentage Error (WAPE)**:
  $$\text{WAPE} = \frac{\sum |y_t - \hat{y}_t|}{\sum y_t} \times 100$$
  *(Preferred over MAPE to prevent infinite explosion when days have near-zero sales).*

The algorithm minimizing MAE on the holdout partition is selected to fit the complete time series and forecast the subsequent 30 days.

### 3.3 95% Confidence Interval Envelope
For horizon step $h \in [1, 30]$:
$$\text{Upper Bound}_h = \hat{y}_h + 1.96 \cdot \sigma_e \sqrt{1 + \frac{h}{15}}$$
$$\text{Lower Bound}_h = \max\left(0.0, \, \hat{y}_h - 1.96 \cdot \sigma_e \sqrt{1 + \frac{h}{15}}\right)$$
where $\sigma_e$ is the standard deviation of model residuals.

---

## 4. Anomaly Detection Methodology

### 4.1 Rolling Z-Score (Daily Revenue Spikes/Drops)
Calculated over a rolling 14-day window:
$$Z_t = \frac{y_t - \mu_{14, t}}{\sigma_{14, t}}$$
- Flagged as **MEDIUM** anomaly if $|Z_t| \ge 2.3$.
- Flagged as **HIGH** anomaly if $|Z_t| \ge 3.0$ or if $Z_t \le -2.3$ (unusual contraction).

### 4.2 Interquartile Range (IQR) for Margin Compression
For daily profit margin series $M$:
- $Q_1 = \text{25th percentile}$, $Q_3 = \text{75th percentile}$.
- $\text{IQR} = Q_3 - Q_1$.
- Lower Fence $= Q_1 - 1.5 \times \text{IQR}$.
Days where margin falls below the Lower Fence are flagged as margin compression anomalies.

---

## 5. What-If Business Simulation Mechanics

To prevent unrealistic assumptions, NEXORA models economic dependencies between pricing, marketing, and demand volume.

### 5.1 Price Elasticity of Demand
$$\text{Volume Multiplier}_{\text{price}} = 1.0 + \left( e_p \times \frac{\Delta P}{P} \right)$$
where $e_p = -1.2$ by default (discretionary retail elasticity). A $+10\%$ price increase automatically contracts volume by $12\%$.

### 5.2 Marketing Diminishing Returns
$$\text{Volume Multiplier}_{\text{mkt}} = 1.0 + e_m \ln\left(1 + \max\left(-0.9, \frac{\Delta M}{M}\right)\right)$$
where $e_m = 0.25$ models logarithmic diminishing returns on ad spend.

### 5.3 Simulated Profit
$$\text{Net Profit}_{\text{sim}} = \text{Revenue}_{\text{sim}} - \text{COGS}_{\text{sim}} - \Delta \text{Marketing Spend}$$
