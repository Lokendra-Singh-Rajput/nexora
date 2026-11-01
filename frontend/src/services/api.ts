import axios from 'axios';
import {
  KpiSummary,
  FilterState,
  RootCauseAnalysis,
  ForecastResult,
  AnomalyItem,
  BusinessInsight,
  SimulationResult,
  CopilotResponse,
  DatasetItem
} from '../types';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

function toQueryParams(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.companyId) params.append('companyId', filters.companyId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.region) params.append('region', filters.region);
  if (filters.category) params.append('category', filters.category);
  if (filters.segment) params.append('segment', filters.segment);
  if (filters.productId) params.append('productId', filters.productId);
  return params.toString();
}

export const apiService = {
  // Executive Overview
  async getOverview(filters: FilterState): Promise<any> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/analytics/overview?${q}`);
    return resp.data.data;
  },

  // Sales Analytics
  async getSales(filters: FilterState): Promise<any> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/analytics/sales?${q}`);
    return resp.data.data;
  },

  // Product Intelligence
  async getProducts(filters: FilterState): Promise<any> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/analytics/products?${q}`);
    return resp.data.data;
  },

  // Customer Analytics
  async getCustomers(filters: FilterState): Promise<any> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/analytics/customers?${q}`);
    return resp.data.data;
  },

  // Inventory Intelligence
  async getInventory(companyId: string = 'novamart'): Promise<any> {
    const resp = await client.get(`/analytics/inventory?companyId=${companyId}`);
    return resp.data.data;
  },

  // Root Cause Analysis
  async getRootCause(filters: FilterState, kpi: string = 'revenue'): Promise<RootCauseAnalysis> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/insights/root-cause?${q}&kpi=${kpi}`);
    return resp.data.data;
  },

  // Predictive Analytics & Forecast
  async getForecast(filters: FilterState, days: number = 30): Promise<ForecastResult> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/forecast?${q}&days=${days}`);
    return resp.data.data;
  },

  // Anomalies
  async getAnomalies(filters: FilterState): Promise<{ anomalies: AnomalyItem[] }> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/insights/anomalies?${q}`);
    return resp.data.data;
  },

  // Business Insights
  async getInsights(filters: FilterState): Promise<{ insights: BusinessInsight[] }> {
    const q = toQueryParams(filters);
    const resp = await client.get(`/insights?${q}`);
    return resp.data.data;
  },

  // What-If Simulation
  async runSimulator(payload: any): Promise<SimulationResult> {
    const resp = await client.post('/simulator/run', payload);
    return resp.data.data;
  },

  // AI Copilot
  async chatCopilot(companyId: string, query: string): Promise<CopilotResponse> {
    const resp = await client.post('/copilot/chat', { companyId, query });
    return resp.data.data;
  },

  // Datasets
  async uploadDataset(formData: FormData, companyId: string, replaceExisting: boolean): Promise<any> {
    const resp = await client.post(`/datasets/upload?companyId=${companyId}&replaceExisting=${replaceExisting}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return resp.data.data;
  },

  async listDatasets(companyId: string = 'novamart'): Promise<DatasetItem[]> {
    const resp = await client.get(`/datasets?companyId=${companyId}`);
    return resp.data.data;
  },

  async resetDemoData(): Promise<any> {
    const resp = await client.post('/datasets/reset-demo');
    return resp.data;
  },

  async listCompanies(): Promise<any[]> {
    const resp = await client.get('/companies');
    return resp.data.data;
  },

  async createCompany(data: { name: string; industry: string; id?: string; description?: string }): Promise<any> {
    const resp = await client.post('/companies', data);
    return resp.data.data;
  },

  async deleteCompany(id: string): Promise<void> {
    await client.delete(`/companies/${id}`);
  },
};
