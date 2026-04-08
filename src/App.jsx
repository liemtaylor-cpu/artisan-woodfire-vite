import { useState, useCallback, useEffect } from 'react';
import { INITIAL_INVENTORY } from './data/inventory';
import { INITIAL_ORDERS } from './data/orders';
import { api } from './utils/api';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import LiveSalesPage from './pages/LiveSalesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';
import OrdersPage from './pages/OrdersPage';
import ForecastingPage from './pages/ForecastingPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import DutiesPage from './pages/DutiesPage';
import StaffCompetencyPage from './pages/StaffCompetencyPage';

let toastId = 0;

const App = () => {
  const [page, setPage] = useState("dashboard");
  const [pageCtx, setPageCtx] = useState({});
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [toasts, setToasts] = useState([]);
  const [slingCount, setSlingCount] = useState(3);
  const [posLastSync, setPosLastSync] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    Promise.all([api.getInventory(), api.getOrders()])
      .then(([inv, ord]) => {
        setInventory(inv);
        setOrders(ord);
      })
      .catch(() => {
        // API unavailable — fall back to static seed data silently
      })
      .finally(() => setLoading(false));
  }, []);

  const navigateTo = useCallback((p, ctx = {}) => { setPage(p); setPageCtx(ctx); }, []);

  const addToast = useCallback(({ type, channel, msg }) => {
    const id = ++toastId;
    setToasts(p => [...p, { id, type, channel, msg, exiting: false }]);
    setSlingCount(n => n + 1);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 450);
    }, 5000);
  }, []);

  const removeToast = id => {
    setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 450);
  };

  const alertCount = inventory.filter(i => i.currentStock < i.minStock).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="text-stone-400 text-sm font-medium">Loading kitchen data…</p>
        </div>
      </div>
    );
  }

  const pages = {
    dashboard:   <Dashboard      inventory={inventory} orders={orders} onNavigate={navigateTo} addToast={addToast} posLastSync={posLastSync} setPosLastSync={setPosLastSync} setInventory={setInventory} />,
    sales:       <LiveSalesPage  inventory={inventory} addToast={addToast} setPosLastSync={setPosLastSync} setInventory={setInventory} />,
    analytics:   <AnalyticsPage  inventory={inventory} />,
    staff:       <StaffPage      addToast={addToast} slingCount={slingCount} setSlingCount={setSlingCount} />,
    settings:    <SettingsPage   addToast={addToast} />,
    inventory:   <InventoryPage  key={JSON.stringify(pageCtx)} inventory={inventory} setInventory={setInventory} addToast={addToast} initCtx={pageCtx} />,
    recipes:     <RecipesPage    inventory={inventory} />,
    orders:      <OrdersPage     key={JSON.stringify(pageCtx)} orders={orders} setOrders={setOrders} inventory={inventory} setInventory={setInventory} addToast={addToast} initCtx={pageCtx} />,
    forecasting: <ForecastingPage inventory={inventory} />,
    duties:      <DutiesPage          addToast={addToast} />,
    competency:  <StaffCompetencyPage addToast={addToast} />,
  };

  return (
    <>
      <div className="flex" style={{ minHeight: "100vh" }}>
        <div className="hidden lg:flex">
          <Sidebar current={page} onNav={setPage} alertCount={alertCount} slingCount={slingCount} />
        </div>
        <main className="flex-1 overflow-auto bg-stone-50">
          <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-24 lg:pb-8">
            <ErrorBoundary key={page}>{pages[page]}</ErrorBoundary>
          </div>
        </main>
      </div>
      <MobileNav current={page} onNav={setPage} alertCount={alertCount} />
      <ToastContainer toasts={toasts} remove={removeToast} />
    </>
  );
};

export default App;
