import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterState, Company } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CopilotDrawer } from './components/copilot/CopilotDrawer';
import { CreateCompanyModal } from './components/company/CreateCompanyModal';

import { OverviewPage } from './pages/OverviewPage';
import { SalesPage } from './pages/SalesPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { InventoryPage } from './pages/InventoryPage';
import { InsightsPage } from './pages/InsightsPage';
import { ForecastPage } from './pages/ForecastPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { apiService } from './services/api';

export const App: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    companyId: 'novamart'
  });
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchCompanies = async () => {
    try {
      const data = await apiService.listCompanies();
      setCompanies(data);
    } catch (e) {
      console.error('Failed to load companies:', e);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [refreshTrigger]);

  const activeCompany = companies.find((c) => c.id === filters.companyId) || {
    id: filters.companyId,
    name: filters.companyId === 'novamart' ? 'NovaMart Retail' : filters.companyId,
    industry: 'RETAIL'
  };

  const handleSelectCompany = (companyId: string) => {
    setFilters({ companyId });
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ companyId: filters.companyId });
  };

  const handleResetDemo = async () => {
    setIsRefreshing(true);
    try {
      await apiService.resetDemoData();
      setRefreshTrigger((prev) => prev + 1);
      setFilters({ companyId: 'novamart' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDataRefreshed = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchCompanies();
  };

  const handleCompanyCreated = (newCompany: Company) => {
    setCompanies((prev) => [...prev, newCompany]);
    setFilters({ companyId: newCompany.id });
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCompanyDeleted = (deletedId: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== deletedId));
    // If the deleted org was active, switch back to novamart
    if (filters.companyId === deletedId) {
      setFilters({ companyId: 'novamart' });
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        {/* Left Fixed Sidebar */}
        <Sidebar companyName={activeCompany.name} activeCompany={activeCompany} />

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onResetDemo={handleResetDemo}
            isCopilotOpen={isCopilotOpen}
            onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
            isRefreshing={isRefreshing}
            companies={companies}
            activeCompany={activeCompany}
            onSelectCompany={handleSelectCompany}
            onOpenCreateCompany={() => setIsCreateCompanyOpen(true)}
            onCompanyDeleted={handleCompanyDeleted}
          />

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<OverviewPage key={`${filters.companyId}-${refreshTrigger}`} filters={filters} activeCompany={activeCompany} />} />
              <Route path="/sales" element={<SalesPage key={`${filters.companyId}-${refreshTrigger}`} filters={filters} activeCompany={activeCompany} />} />
              <Route path="/products" element={<ProductsPage key={`${filters.companyId}-${refreshTrigger}`} filters={filters} activeCompany={activeCompany} />} />
              <Route path="/customers" element={<CustomersPage key={`${filters.companyId}-${refreshTrigger}`} filters={filters} activeCompany={activeCompany} />} />
              <Route path="/inventory" element={<InventoryPage key={`${filters.companyId}-${refreshTrigger}`} companyId={filters.companyId} activeCompany={activeCompany} />} />
              <Route path="/insights" element={<InsightsPage key={`${filters.companyId}-${refreshTrigger}`} filters={filters} />} />
              <Route path="/forecast" element={<ForecastPage key={`${filters.companyId}-${refreshTrigger}`} filters={filters} />} />
              <Route path="/simulator" element={<SimulatorPage key={`${filters.companyId}-${refreshTrigger}`} companyId={filters.companyId} />} />
              <Route
                path="/data"
                element={<DataManagementPage key={`${filters.companyId}-${refreshTrigger}`} companyId={filters.companyId} activeCompany={activeCompany} onDataRefreshed={handleDataRefreshed} />}
              />
              <Route path="/settings" element={<SettingsPage key={`${filters.companyId}-${refreshTrigger}`} companyId={filters.companyId} />} />
            </Routes>
          </main>
        </div>

        {/* Right Collapsible AI Analyst Copilot */}
        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          companyId={filters.companyId}
          activeCompany={activeCompany}
        />

        {/* Create Company Profile Modal */}
        <CreateCompanyModal
          isOpen={isCreateCompanyOpen}
          onClose={() => setIsCreateCompanyOpen(false)}
          onCompanyCreated={handleCompanyCreated}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
