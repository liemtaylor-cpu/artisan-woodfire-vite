import { useState, useCallback, useEffect } from 'react';
import { INITIAL_INVENTORY } from './data/inventory';
import { INITIAL_ORDERS } from './data/orders';
import { api } from './utils/api';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import EmployeePage from './pages/EmployeePage';
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
import TransactionsPage from './pages/TransactionsPage';

let toastId = 0;

const ROLE_PAGES = {
  owner:    ['dashboard','sales','analytics','staff','settings','inventory','recipes','orders','forecasting','duties','competency','transactions'],
  manager:  ['dashboard','sales','analytics','staff','inventory','recipes','orders','forecasting','duties','competency','transactions'],
  employee: ['employee','duties','recipes'],
};

const DEFAULT_PAGE = {
  owner:    'dashboard',
  manager:  'dashboard',
  employee: 'employee',
};

const App = () => {
  const [role, setRole] = useState(() => localStorage.getItem('artisan_role') || null);
  const [page, setPage] = useState(() => {
    const savedRole = localStorage.getItem('artisan_role');
    return DEFAULT_PAGE[savedRole] || 'dashboard';
  });
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

  const handleLogin = (r) => {
    setRole(r);
    setPage(DEFAULT_PAGE[r] || 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('artisan_role');
    setRole(null);
    setPage('dashboard');
  };

  const navigateTo = useCallback((p, ctx = {}) => {
    setPage(p);
    setPageCtx(ctx);
  }, []);

  // Guard navigation: only allow pages the current role can access
  const safeNav = useCallback((p, ctx = {}) => {
    const allowed = ROLE_PAGES[role] || [];
    if (allowed.includes(p)) {
      setPage(p);
      setPageCtx(ctx);
    }
  }, [role]);

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

  // Show login if no role
  if (!role) return <LoginPage onLogin={handleLogin} />;

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

  const allowedPages = ROLE_PAGES[role] || [];

  const pages = {
    employee:    <EmployeePage   inventory={inventory} onNavigate={safeNav} />,
    dashboard:   <Dashboard      inventory={inventory} orders={orders} onNavigate={navigateTo} addToast={addToast} posLastSync={posLastSync} setPosLastSync={setPosLastSync} setInventory={setInventory} />,
    sales:       <LiveSalesPage  inventory={inventory} addToast={addToast} setPosLastSync={setPosLastSync} setInventory={setInventory} />,
    analytics:   <AnalyticsPage  inventory={inventory} />,
    staff:       <StaffPage      addToast={addToast} slingCount={slingCount} setSlingCount={setSlingCount} hidePayRates={role === 'manager'} />,
    settings:    <SettingsPage   addToast={addToast} />,
    inventory:   <InventoryPage  key={JSON.stringify(pageCtx)} inventory={inventory} setInventory={setInventory} addToast={addToast} initCtx={pageCtx} />,
    recipes:     <RecipesPage    inventory={inventory} />,
    orders:      <OrdersPage     key={JSON.stringify(pageCtx)} orders={orders} setOrders={setOrders} inventory={inventory} setInventory={setInventory} addToast={addToast} initCtx={pageCtx} />,
    forecasting: <ForecastingPage inventory={inventory} />,
    duties:      <DutiesPage          addToast={addToast} />,
    competency:    <StaffCompetencyPage addToast={addToast} />,
    transactions:  <TransactionsPage    addToast={addToast} />,
  };

  // Ensure current page is valid for role; fall back to default
  const activePage = allowedPages.includes(page) ? page : DEFAULT_PAGE[role];

  return (
    <>
      <div className="flex" style={{ minHeight: "100vh" }}>
        <div className="hidden lg:flex">
          <Sidebar
            current={activePage}
            onNav={safeNav}
            alertCount={alertCount}
            slingCount={slingCount}
            role={role}
            allowedPages={allowedPages}
            onLogout={handleLogout}
          />
        </div>
        <main className="flex-1 overflow-auto bg-stone-50">
          <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-24 lg:pb-8">
            <ErrorBoundary key={activePage}>{pages[activePage]}</ErrorBoundary>
          </div>
        </main>
      </div>
      <MobileNav
        current={activePage}
        onNav={safeNav}
        alertCount={alertCount}
        role={role}
        allowedPages={allowedPages}
        onLogout={handleLogout}
      />
      <ToastContainer toasts={toasts} remove={removeToast} />
    </>
  );
};

export default App;
