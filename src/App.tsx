import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { NavItemKey } from './components/layout/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ProductosView } from './views/ProductosView';
import { ProveedoresView } from './views/ProveedoresView';
import { ComprasView } from './views/ComprasView';
import { InventarioView } from './views/InventarioView';
import { VentasView } from './views/VentasView';
import { ReportesView } from './views/ReportesView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');

  const renderView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'productos':
        return <ProductosView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'compras':
        return <ComprasView />;
      case 'inventario':
        return <InventarioView />;
      case 'ventas':
        return <VentasView />;
      case 'reportes':
        return <ReportesView />;
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderView()}
    </Layout>
  );
};

export default App;
