import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterState } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CopilotDrawer } from './components/copilot/CopilotDrawer';

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
  const [filters, setFilters] = useState<FilterState>({
    companyId: 'novamart'
  });
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ companyId: 'novamart' });
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
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        {/* Left Fixed Sidebar */}
        <Sidebar companyName="NovaMart Retail" />

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
          />

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<OverviewPage key={refreshTrigger} filters={filters} />} />
              <Route path="/sales" element={<SalesPage key={refreshTrigger} filters={filters} />} />
              <Route path="/products" element={<ProductsPage key={refreshTrigger} filters={filters} />} />
              <Route path="/customers" element={<CustomersPage key={refreshTrigger} filters={filters} />} />
              <Route path="/inventory" element={<InventoryPage key={refreshTrigger} companyId={filters.companyId} />} />
              <Route path="/insights" element={<InsightsPage key={refreshTrigger} filters={filters} />} />
              <Route path="/forecast" element={<ForecastPage key={refreshTrigger} filters={filters} />} />
              <Route path="/simulator" element={<SimulatorPage key={refreshTrigger} companyId={filters.companyId} />} />
              <Route
                path="/data"
                element={<DataManagementPage key={refreshTrigger} companyId={filters.companyId} onDataRefreshed={handleDataRefreshed} />}
              />
              <Route path="/settings" element={<SettingsPage key={refreshTrigger} companyId={filters.companyId} />} />
            </Routes>
          </main>
        </div>

        {/* Right Collapsible AI Analyst Copilot */}
        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          companyId={filters.companyId}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
