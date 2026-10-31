export interface KpiValue {
  current: number;
  previous: number;
  abs_diff: number;
  pct_diff: number;
  trend: 'up' | 'down' | 'flat';
}

export interface KpiSummary {
  // Retail
  revenue?: KpiValue;
  profit?: KpiValue;
  profit_margin?: KpiValue;
  total_orders?: KpiValue;
  average_order_value?: KpiValue;
  units_sold?: KpiValue;
  return_rate?: KpiValue;
  total_customers?: KpiValue;

  // Banking
  transaction_value?: KpiValue;
  transaction_volume?: KpiValue;
  average_transaction_value?: KpiValue;
  default_rate?: KpiValue;
  fraud_rate?: KpiValue;
  fraud_count?: KpiValue;
  high_risk_volume?: KpiValue;

  // Manufacturing
  production_volume?: KpiValue;
  defect_rate?: KpiValue;
  production_efficiency?: KpiValue;
  machine_downtime?: KpiValue;
  defective_units?: KpiValue;
  planned_volume?: KpiValue;

  [key: string]: KpiValue | undefined;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  description?: string;
  recordCount?: number;
  datasetCount?: number;
  createdAt?: string;
}

export interface ExecutiveOverviewData {
  kpis: KpiSummary;
  sales?: any;
  trends?: any;
  products?: any;
  customers?: any;
  meta: {
    companyId: string;
    companyName: string;
    industry: string;
    recordCount: number;
    previousRecordCount?: number;
    refreshedAt: string;
  };
}

export interface DailyTrendPoint {
  date: string;
  revenue?: number;
  profit?: number;
  orders?: number;
  units?: number;
  aov?: number;
  profit_margin?: number;
  // Banking
  transaction_value?: number;
  transaction_volume?: number;
  fraud_count?: number;
  default_count?: number;
  // Manufacturing
  production_volume?: number;
  planned_volume?: number;
  defective_units?: number;
  downtime_minutes?: number;
  defect_rate?: number;
}

export interface MonthlyTrendPoint {
  month_str: string;
  revenue?: number;
  profit?: number;
  orders?: number;
  units?: number;
  aov?: number;
  profit_margin?: number;
  transaction_value?: number;
  transaction_volume?: number;
  production_volume?: number;
  defect_rate?: number;
}

export interface RegionalPerformance {
  region: string;
  revenue: number;
  profit: number;
  orders: number;
  units: number;
  revenue_share: number;
  profit_margin: number;
  aov: number;
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  profit: number;
  orders: number;
  units: number;
  revenue_share: number;
  profit_margin: number;
}

export interface DiscountTier {
  tier: string;
  order_count: number;
  revenue: number;
  profit: number;
  profit_margin: number;
}

export interface ProductItem {
  product_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  revenue: number;
  profit: number;
  units: number;
  orders: number;
  profit_margin: number;
  revenue_share: number;
  avg_discount?: number;
  growth?: number;
}

export interface InventoryItem {
  product_id: string;
  product_name: string;
  category?: string;
  stock_quantity: number;
  reorder_level: number;
  supplier_lead_time: number;
  daily_demand: number;
  days_remaining: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  recommended_reorder_qty: number;
}

export interface CustomerSegment {
  segment: string;
  revenue: number;
  profit: number;
  customer_count: number;
  order_count: number;
  aov: number;
  profit_margin: number;
  revenue_share: number;
}

export interface RootCauseDimension {
  dimension: string;
  name: string;
  current: number;
  previous: number;
  absolute_change: number;
  percentage_change?: number;
  contribution_to_total_change: number;
}

export interface RootCauseAnalysis {
  status?: string;
  message?: string;
  investigated_kpi?: string;
  target_kpi?: string;
  current_period_value?: number;
  previous_period_value?: number;
  absolute_change?: number;
  percentage_change?: number;
  variance_decomposition: {
    order_volume_effect: number;
    aov_effect: number;
    interaction_effect: number;
    sum_of_effects?: number;
    residual_discrepancy?: number;
  };
  dimension_breakdowns: {
    by_region: RootCauseDimension[];
    by_category: RootCauseDimension[];
    top_decliners_products?: RootCauseDimension[];
    top_growers_products?: RootCauseDimension[];
    [key: string]: any;
  };
  potential_explanations?: string[];
  suggested_actions?: string[];
  evidence_limitations?: string;
  diagnostic_summary?: {
    primary_driver_type: string;
    dominant_dimension: string;
    key_findings: string[];
    recommended_focus_areas: string[];
  };
}

export interface ForecastPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  actual_sales?: number;
  forecast_sales?: number;
  lower_bound?: number | null;
  upper_bound?: number | null;
  is_projection?: boolean;
}

export interface ForecastResult {
  status: string;
  model_selected: string;
  forecast_horizon_days: number;
  projected_total_revenue_30d: number;
  historical_actual_total_30d?: number;
  projected_growth_rate?: number;
  evaluation_metrics: {
    mae: number;
    rmse: number;
    mape: number;
    wape: number;
  };
  all_model_evaluations?: Array<{
    model: string;
    mae: number;
    rmse: number;
    mape: number;
    wape: number;
  }>;
  candidate_model_evaluations?: Array<{
    model_name: string;
    mae: number;
    rmse: number;
    wape: number;
    selected: boolean;
  }>;
  historical_plus_forecast?: ForecastPoint[];
  time_series?: ForecastPoint[];
  forecast_only: ForecastPoint[];
  assumptions_and_limitations?: string[];
}

export interface AnomalyItem {
  metric: string;
  date_or_entity: string;
  observed_value: any;
  expected_baseline: any;
  expected_range: any[];
  deviation: number;
  detection_method: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description?: string;
  explanation: string;
}

export interface BusinessInsight {
  insight_id?: string;
  id?: string;
  category: string;
  title: string;
  business_area: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  supporting_evidence: string;
  business_impact: string;
  recommended_action: string;
  confidence: string;
  generated_timestamp: string;
}

export interface SimulationResult {
  status: string;
  inputs: {
    price_change_pct: number;
    discount_change_pct: number;
    marketing_spend_change_pct: number;
    volume_shock_pct: number;
    cost_change_pct: number;
  };
  baseline: {
    revenue: number;
    profit: number;
    profit_margin: number;
    units_sold: number;
    orders: number;
  };
  simulated: {
    revenue: number;
    profit: number;
    profit_margin: number;
    units_sold: number;
    revenue_difference: number;
    revenue_percent_difference: number;
    profit_difference: number;
    profit_percent_difference: number;
    margin_difference: number;
  };
  scenario_comparison: Array<{
    metric: string;
    baseline: number;
    simulated: number;
  }>;
  assumptions: string[];
}

export interface CopilotResponse {
  source: string;
  tool_used: string;
  raw_tool_data: any;
  response: {
    direct_answer: string;
    supporting_metrics: Record<string, any>;
    interpretation: string;
    suggested_actions: string[];
    limitations: string;
  };
}

export interface DatasetItem {
  id: string;
  companyId: string;
  filename: string;
  rowCount: number;
  validationStatus: string;
  qualityScore: number;
  version: number;
  createdAt: string;
}

export interface FilterState {
  companyId: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  category?: string;
  segment?: string;
  productId?: string;
}
