import React, { useState, useCallback, useEffect, useRef } from 'react';
import Icon from '../components/Icon.jsx';
import StockBar from '../components/StockBar.jsx';
import SupplierChip from '../components/SupplierChip.jsx';
import KpiCard from '../components/KpiCard.jsx';
import Modal from '../components/Modal.jsx';
import { RECIPES } from '../data/recipes.js';
import { TODAY_SALES } from '../data/sales.js';
import { fmt$, fmtNum } from '../utils/helpers.js';

const Dashboard = ({ inventory, orders, onNavigate, addToast, posLastSync, setPosLastSync, setInventory }) => {
  const [syncing, setSyncing]             = useState(false);
  const [syncResult, setSyncResult]       = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const syncTimerRef                      = useRef(null);

  // Clean up any pending timer on unmount
  useEffect(() => () => clearTimeout(syncTimerRef.current), []);

  const lowStock  = inventory.filter(i => i.currentStock < i.minStock);
  const totalValue = inventory.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
  const openOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  const computeDeductions = useCallback(() => {
    const deduct = {};
    TODAY_SALES.forEach(sale => {
      const recipe = RECIPES.find(r => r.id === sale.recipeId);
      if (!recipe) return;
      recipe.ingredients.forEach(ing => {
        deduct[ing.id] = (deduct[ing.id] || 0) + ing.qty * sale.qty;
      });
    });
    return deduct;
  }, []);

  const handlePosSync = () => {
    setSyncing(true);
    syncTimerRef.current = setTimeout(() => {
      const deductions = computeDeductions();
      const results = [];
      const newInv = inventory.map(item => {
        if (!deductions[item.id]) return item;
        const used = Math.round(deductions[item.id] * 100) / 100;
        const newStock = Math.max(0, Math.round((item.currentStock - used) * 100) / 100);
        const wentLow = newStock < item.minStock && item.currentStock >= item.minStock;
        results.push({ item, used, newStock, wentLow });
        return { ...item, currentStock: newStock };
      });
      setInventory(newInv);
      setSyncResult(results);
      setPosLastSync(new Date());
      setSyncing(false);
      setShowSyncModal(true);
      results.filter(r => r.wentLow).forEach(r => {
        addToast({ type: 'warn', channel: '#kitchen-mgmt', msg: `⚠️ ${r.item.name} just dropped below minimum (${fmtNum(r.newStock)} ${r.item.unit} remaining). Reorder from ${r.item.supplier}.` });
      });
      const totalSalesQty = TODAY_SALES.reduce((s, t) => s + t.qty, 0);
      addToast({ type: 'success', channel: '#daily-ops', msg: `✅ Harbortouch synced — ${totalSalesQty} covers tonight. Inventory updated.` });
    }, 1600);
  };

  const activity = [
    { text: 'PO-2026-041 from US Foods is in transit',      time: '2h ago', dot: 'bg-blue-400' },
    { text: 'Fresh Basil dropped below minimum stock level', time: '4h ago', dot: 'bg-amber-400' },
    { text: 'PO-2026-042 from US Foods delivered',           time: '1d ago', dot: 'bg-emerald-400' },
    { text: 'Burrata at 83% of minimum threshold',           time: '1d ago', dot: 'bg-amber-400' },
    { text: 'New PO-2026-040 submitted to Sam\'s Club',      time: '2d ago', dot: 'bg-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-stone-400 text-sm mt-0.5">Sunday, March 29, 2026</p>
        </div>
        <button onClick={handlePosSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0">
          <Icon name={syncing ? 'sync' : 'pos'} className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Harbortouch'}
        </button>
      </div>

      <div className="bg-stone-800 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="p-1.5 bg-stone-700 rounded-lg"><Icon name="pos" className="w-4 h-4 text-orange-400" /></div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Harbortouch POS</p>
          <p className="text-stone-400 text-xs">
            {posLastSync
              ? `Last synced ${posLastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — inventory auto-updated from tonight's sales`
              : 'Not yet synced today — click Sync Harbortouch to pull tonight\'s sales'}
          </p>
        </div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${posLastSync ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Icon name="alert" className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} items below minimum stock</p>
            <p className="text-xs text-amber-600 mt-0.5 truncate">
              {lowStock.slice(0, 4).map(i => i.name).join(', ')}{lowStock.length > 4 ? ` +${lowStock.length - 4} more` : ''}
            </p>
          </div>
          <button onClick={() => onNavigate('inventory')} className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">View All →</button>
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
            <h2 className="font-semibold text-stone-700">Tonight's Sales (Harbortouch)</h2>
            <p className="text-xs text-stone-400 mt-0.5">Each sale auto-deducts ingredients when you sync</p>
          </div>
          <span className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-lg font-medium">
            {TODAY_SALES.reduce((s, t) => s + t.qty, 0)} covers
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TODAY_SALES.map(sale => {
            const r = RECIPES.find(r => r.id === sale.recipeId);
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
          <div className="space-y-3.5">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                <div><p className="text-sm text-stone-600 leading-snug">{a.text}</p><p className="text-xs text-stone-400 mt-0.5">{a.time}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSyncModal && syncResult && (
        <Modal title="Harbortouch Sync Complete" onClose={() => setShowSyncModal(false)} wide>
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-800">✅ Inventory updated from tonight's {TODAY_SALES.reduce((s, t) => s + t.qty, 0)} covers</p>
              <p className="text-xs text-emerald-600 mt-1">Low stock Sling alerts sent automatically to #kitchen-mgmt</p>
            </div>
            <div className="overflow-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="text-xs text-stone-400 uppercase border-b border-stone-100">
                  <tr><th className="pb-2 text-left">Item</th><th className="pb-2 text-right">Used</th><th className="pb-2 text-right">Remaining</th><th className="pb-2 text-right">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {syncResult.map(r => (
                    <tr key={r.item.id} className="hover:bg-stone-50">
                      <td className="py-2 text-stone-700">{r.item.name}</td>
                      <td className="py-2 text-right text-stone-500">−{fmtNum(r.used)} {r.item.unit}</td>
                      <td className="py-2 text-right font-medium text-stone-700">{fmtNum(r.newStock)} {r.item.unit}</td>
                      <td className="py-2 text-right">
                        {r.wentLow
                          ? <span className="text-xs font-bold text-red-600">⚠ Sling sent</span>
                          : r.newStock < r.item.minStock
                            ? <span className="text-xs text-amber-600">Low</span>
                            : <span className="text-xs text-emerald-600">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowSyncModal(false)} className="w-full py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-900 transition-colors">Done</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
