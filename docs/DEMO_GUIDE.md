# NEXORA — Demonstration Walkthrough Guide
**Document ID: NEX-DEMO-2026**

---

## 5-Minute Executive Demonstration Script

Follow this step-by-step walkthrough to showcase the end-to-end capabilities of NEXORA.

---

### Step 1: Open NEXORA & Review Executive Overview (0:00 - 1:00)
1. Navigate to `http://localhost:3000`.
2. Notice the **NovaMart Retail** synthetic dataset loaded automatically on startup.
3. Review the top KPI cards:
   - **Total Revenue**: ~$3.13M across 4,452 orders.
   - **Total Profit**: ~$986K with a **31.5%** net margin.
   - **Average Order Value (AOV)**: ~$703.
   - **Return Rate**: ~4.8%.
4. Review the chronological Area chart showing monthly revenue and profit trajectory, as well as the regional breakdown.

---

### Step 2: Investigate Business Anomalies & Drill Down (1:00 - 2:00)
1. Click **Sales Analytics** in the sidebar.
2. Toggle between **Monthly Trend** and **Daily Granularity** to observe day-of-week sales variations.
3. Review the **Regional Sales Performance** table: note the steady performance across South, Central, and North, while the West region experienced supply disruption.
4. Scroll to **Discount Impact & Margin Dilution**: note how deep discounts (>20%) erode margin down to sub-15% levels.
5. Click **Product Intelligence**: point out the **Pareto Concentration Banner** (Top 20% of SKUs drive over 48% of total revenue). Highlight the **Revenue Traps** card showing high-revenue items with low margins.

---

### Step 3: Run Signature Root Cause Analysis (2:00 - 3:00)
1. Click **AI Insights & Root Cause** in the sidebar.
2. Examine the **Variance Decomposition Matrix**:
   - Total period-over-period change decomposed identically into:
     - **Order Volume Effect**: $\Delta \text{Volume} \times \text{Prev AOV}$
     - **AOV Effect**: $\text{Prev Volume} \times \Delta \text{AOV}$
     - **Interaction Effect**
   - Review the regional variance list: note the exact dollar contribution of each region to the top-line shift.
   - Review the synthesized business drivers and actionable management prescriptions.
3. Scroll down to the **Prioritized AI Directives**: show the **CRITICAL** and **HIGH** alerts covering margin dilution, West region contraction, and inventory depletion.

---

### Step 4: Examine Forecasts & What-If Simulation (3:00 - 4:00)
1. Click **Predictive Forecasting**:
   - View the 30-day forward daily sales projection with the shaded **95% confidence interval band**.
   - Show the **Chronological Model Benchmark Table**: explain how the engine evaluated Naive Baseline, 7-Day Moving Average, and Holt-Winters Exponential Smoothing on an out-of-sample holdout test partition to pick the model minimizing MAE.
2. Click **What-If Simulator**:
   - Move the **Selling Price Adjustment** slider to `+10%`.
   - Observe how simulated units sold immediately drop from `13,147` to `~12,029` due to price elasticity of demand ($-1.2$).
   - Move the **Marketing Expenditure Shift** slider to `+20%` to see the volume offset.
   - Observe the real-time financial comparison chart and transparent economic assumptions.

---

### Step 5: Ask the AI Analyst Copilot & Upload New Data (4:00 - 5:00)
1. Click the **AI Analyst Copilot** button in the topbar to open the right drawer.
2. Click the quick inquiry: *"Why did revenue decrease recently?"*
3. Show the response:
   - Tool execution badge: `Tool: get_root_cause_analysis`
   - Direct answer backed by numbers.
   - Supporting facts card.
   - Interpretation and operational recommendations.
4. Click **Data Management**:
   - Drag and drop `sample-data/orders.csv` or `sample-data/novamart_retail_combined.xlsx`.
   - Click **Process Dataset**.
   - Point out the **Data Quality Scorecard (98.5/100)** and confirmed schema mapping.
   - Notice the dataset version increment to `v2` and how the entire dashboard dynamically refreshes with zero source code changes!
5. Click **Reset Demo Data** to restore the baseline benchmark state.
