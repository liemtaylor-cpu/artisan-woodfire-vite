import { useState, useEffect, useMemo, useCallback } from 'react';
import { fmt$ } from '../utils/helpers';
import { api } from '../utils/api';
import KpiCard from '../components/KpiCard';
import Icon from '../components/Icon';

const LiveSalesPage = ({ inventory, addToast }) => {
  const [salesRaw, setSalesRaw] = useState([]);
  const [recipes, setRecipes]   = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const loadData = useCallback(() => {
    return Promise.all([api.getSales(), api.getRecipes()])
      .then(([s, r]) => { setSalesRaw(s); setRecipes(r); setLastFetch(new Date()); });
  }, []);

  useEffect(() => {
    loadData().catch(() => {}).finally(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      addToast({ type: 'success', channel: 'Shift4', msg: 'Sales data refreshed.' });
    } catch {
      addToast({ type: 'warn', channel: 'Shift4', msg: 'Refresh failed — check connection.' });
    } finally {
      setRefreshing(false);
    }
  };

  const rows = useMemo(() => salesRaw.map(s => {
    const recipe = recipes.find(r => r.id === s.recipeId);
    const cogs = recipe ? recipe.ingredients.reduce((sum, ing) => {
      const item = inventory.find(i => i.id === ing.id);
      return sum + (item ? ing.qty * item.unitCost : 0);
    }, 0) : 0;
    const rev = (recipe?.price || 0) * s.qty;
    const totalCogs = cogs * s.qty;
    const gp = rev - totalCogs;
    const margin = rev > 0 ? gp / rev * 100 : 0;
    return { ...s, recipe, cogs, rev, totalCogs, gp, margin };
  }), [salesRaw, recipes, inventory]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    qty: acc.qty + r.qty, rev: acc.rev + r.rev, cogs: acc.cogs + r.totalCogs, gp: acc.gp + r.gp
  }), { qty: 0, rev: 0, cogs: 0, gp: 0 }), [rows]);

  const avgMargin = totals.rev > 0 ? totals.gp / totals.rev * 100 : 0;

  if (loading) return <div className="flex items-center justify-center h-64 text-stone-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Live Sales</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Harbortouch · Shift4 · Auto-updating via webhook
            {lastFetch && <> · Fetched {lastFetch.toLocaleTimeString()}</>}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Icon name="sync" className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Gross Revenue" value={fmt$(totals.rev)} subtitle="Today's tickets" icon="dashboard" variant="orange" />
        <KpiCard title="Total COGS" value={fmt$(totals.cogs)} subtitle="Ingredient cost" icon="inventory" variant="blue" />
        <KpiCard title="Gross Profit" value={fmt$(totals.gp)} subtitle={`${avgMargin.toFixed(1)}% margin`} icon="forecast" variant={avgMargin >= 60 ? "green" : "amber"} />
        <KpiCard title="Covers Sold" value={totals.qty} subtitle={`${rows.length} menu items`} icon="recipes" variant="blue" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">Sales by Item</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-10">No sales yet tonight — orders will appear here automatically as they process.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">COGS</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map(r => {
                  const mc = r.margin >= 65 ? "text-emerald-600 bg-emerald-50" : r.margin >= 50 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                  return (
                    <tr key={r.recipeId} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-stone-800">{r.recipe?.icon} {r.recipe?.name}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{fmt$(r.recipe?.price || 0)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-700">{r.qty}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{fmt$(r.rev)}</td>
                      <td className="px-4 py-3 text-right text-stone-500">{fmt$(r.totalCogs)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-700">{fmt$(r.gp)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${mc}`}>{r.margin.toFixed(1)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 font-bold text-stone-800 border-t-2 border-stone-200">
                  <td className="px-5 py-3" colSpan={2}>Totals</td>
                  <td className="px-4 py-3 text-right">{totals.qty}</td>
                  <td className="px-4 py-3 text-right">{fmt$(totals.rev)}</td>
                  <td className="px-4 py-3 text-right">{fmt$(totals.cogs)}</td>
                  <td className="px-4 py-3 text-right">{fmt$(totals.gp)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${avgMargin >= 60 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>{avgMargin.toFixed(1)}%</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
        <h2 className="font-semibold text-stone-700 mb-4">COGS per Pizza</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rows.map(r => (
            <div key={r.recipeId} className="rounded-xl border border-stone-100 p-3 text-center">
              <p className="text-lg mb-1">{r.recipe?.icon}</p>
              <p className="text-xs font-medium text-stone-600 leading-tight">{r.recipe?.name}</p>
              <p className="text-sm font-bold text-stone-800 mt-1">{fmt$(r.cogs)}</p>
              <p className="text-xs text-stone-400">/ pizza</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveSalesPage;
