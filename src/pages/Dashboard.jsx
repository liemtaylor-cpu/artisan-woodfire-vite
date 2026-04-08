import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../components/Icon.jsx';
import StockBar from '../components/StockBar.jsx';
import SupplierChip from '../components/SupplierChip.jsx';
import KpiCard from '../components/KpiCard.jsx';
import { api } from '../utils/api.js';
import { fmt$, fmtNum } from '../utils/helpers.js';

const Dashboard = ({ inventory, orders, onNavigate, addToast, setInventory }) => {
  const [refreshing, setRefreshing]       = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [sales, setSales]                 = useState([]);
  const [recipes, setRecipes]             = useState([]);
  const [txLog, setTxLog]                 = useState([]);

  const loadData = useCallback(() => {
    return Promise.all([api.getSales(), api.getRecipes(), api.getTransactions()])
      .then(([s, r, tx]) => { setSales(s); setRecipes(r); setTxLog(tx.slice(0, 10)); })
      .catch(() => {});
  }, []);

  // Load on mount
  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [freshInv] = await Promise.all([api.getInventory(), loadData()]);
      setInventory(freshInv);
      addToast({ type: 'success', channel: 'Dashboard', msg: 'Data refreshed from backend.' });
    } catch {
      addToast({ type: 'alert', channel: 'Dashboard', msg: 'Refresh failed — check connection.' });
    } finally {
      setRefreshing(false);
    }
  };

  const lowStock    = inventory.filter(i => i.currentStock < i.minStock);
  const totalValue  = inventory.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
  const openOrders  = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const totalCovers = sales.reduce((s, t) => s + t.qty, 0);

  // Build activity feed from real data
  const activity = [
    ...txLog.slice(0, 3).map(tx => ({
      text: tx.test
        ? `Test order fired — ${tx.order?.items?.length || 0} item(s), ${tx.deductions?.length || 0} deductions`
        : `POS order received — ${tx.order?.items?.length || 0} item(s) processed`,
      time: formatRelative(tx.receivedAt),
      dot: tx.lowStockAlerts?.length ? 'bg-amber-400' : 'bg-emerald-400',
    })),
    ...lowStock.slice(0, 2).map(item => ({
      text: `${item.name} is below minimum stock (${fmtNum(item.currentStock)} ${item.unit} remaining)`,
      time: 'now',
      dot: 'bg-red-400',
    })),
    ...orders.filter(o => o.status === 'In Transit').slice(0, 2).map(o => ({
      text: `PO ${o.id} from ${o.supplier} is in transit`,
      time: formatRelative(o.orderDate),
      dot: 'bg-blue-400',
    })),
  ].slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-stone-400 text-sm mt-0.5">{today}</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0">
          <Icon name="sync" className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {lowStock.length > 0 && !alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Icon name="alert" className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} items below minimum stock</p>
            <p className="text-xs text-amber-600 mt-0.5 truncate">
              {lowStock.slice(0, 4).map(i => i.name).join(', ')}{lowStock.length > 4 ? ` +${lowStock.length - 4} more` : ''}
            </p>
          </div>
          <button onClick={() => onNavigate('inventory')} className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">View All →</button>
          <button onClick={() => setAlertDismissed(true)} className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 ml-1" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total SKUs"       value={inventory.length}    subtitle="Across 6 categories"   icon="inventory" variant="orange" onClick={() => onNavigate('inventory', {})} />
        <KpiCard title="Low Stock Alerts" value={lowStock.length}     subtitle="Need reordering"        icon="alert"     variant="red"    onClick={() => onNavigate('inventory', { lowStockOnly: true })} />
        <KpiCard title="Inventory Value"  value={fmt$(totalValue)}    subtitle="At current cost"        icon="dollar"    variant="green"  onClick={() => onNavigate('inventory', { sortBy: 'value-desc' })} />
        <KpiCard title="Open Orders"      value={openOrders.length}   subtitle="Sam's Club + US Foods"  icon="truck"     variant="blue"   onClick={() => onNavigate('orders', { status: 'active' })} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-stone-700">Tonight's Sales</h2>
            <p className="text-xs text-stone-400 mt-0.5">Auto-updated via Shift4 webhook · {totalCovers} covers</p>
          </div>
          <span className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-lg font-medium">
            {totalCovers} covers
          </span>
        </div>
        {sales.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">No sales yet tonight</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sales.map(sale => {
              const r = recipes.find(r => r.id === sale.recipeId);
              if (!r) return null;
              return (
                <div key={sale.recipeId} className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">{r.name}</p>
                    <p className="text-xs text-stone-400">{sale.qty} sold · {fmt$(r.price * sale.qty)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-700">Low Stock Items</h2>
            <button onClick={() => onNavigate('inventory')} className="text-xs text-orange-600 hover:text-orange-800 font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0
              ? <p className="text-sm text-stone-400 text-center py-6">All items are well stocked ✓</p>
              : lowStock.slice(0, 7).map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-stone-700 flex-1 truncate">{item.name}</span>
                  <SupplierChip name={item.supplier} />
                  <div className="w-20"><StockBar current={item.currentStock} min={item.minStock} max={item.maxStock} /></div>
                </div>
              ))
            }
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h2 className="font-semibold text-stone-700 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-3.5">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                  <div><p className="text-sm text-stone-600 leading-snug">{a.text}</p><p className="text-xs text-stone-400 mt-0.5">{a.time}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatRelative(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default Dashboard;
