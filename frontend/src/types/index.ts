export interface KpiValue {
  current: number;
  previous: number;
  abs_diff: number;
  pct_diff: number;
  trend: 'up' | 'down' | 'flat';
}

export interface KpiSummary {
  revenue: KpiValue;
  profit: KpiValue;
  profit_margin: KpiValue;
  total_orders: KpiValue;
  average_order_value: KpiValue;
  units_sold: KpiValue;
  return_rate: KpiValue;
  total_customers: KpiValue;
}

export interface DailyTrendPoint {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
  units: number;
  aov: number;
  profit_margin: number;
}

export interface MonthlyTrendPoint {
  month_str: string;
  revenue: number;
  profit: number;
  orders: number;
  units: number;
  aov: number;
  profit_margin: number;
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
  orders: number;
  customers: number;
  revenue_share: number;
  profit_margin: number;
  aov: number;
}

export interface FrequencyBracket {
  frequency_bracket: string;
  customer_count: number;
  percentage: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  segment: string;
  total_spent: number;
  total_profit: number;
  orders_count: number;
  units_bought: number;
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
  investigated_kpi: string;
  current_period_value: number;
  previous_period_value: number;
  absolute_change: number;
  percentage_change: number;
  variance_decomposition: {
    order_volume_effect: number;
    aov_effect: number;
    interaction_effect: number;
  };
  dimension_breakdowns: {
    by_region: RootCauseDimension[];
    by_category: RootCauseDimension[];
    top_decliners_products: RootCauseDimension[];
    top_growers_products: RootCauseDimension[];
  };
  potential_explanations: string[];
  suggested_actions: string[];
  evidence_limitations: string;
}

export interface ForecastPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
}

export interface ForecastResult {
  status: string;
  model_selected: string;
  forecast_horizon_days: number;
  evaluation_metrics: {
    mae: number;
    rmse: number;
    mape: number;
    wape: number;
  };
  all_model_evaluations: Array<{
    model: string;
    mae: number;
    rmse: number;
    mape: number;
    wape: number;
  }>;
  historical_plus_forecast: ForecastPoint[];
  forecast_only: ForecastPoint[];
  projected_total_revenue_30d: number;
}

export interface AnomalyItem {
  metric: string;
  date_or_entity: string;
  observed_value: any;
  expected_baseline: any;
  expected_range: any[];
  deviation: number;
  detection_method: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface BusinessInsight {
  insight_id: string;
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
