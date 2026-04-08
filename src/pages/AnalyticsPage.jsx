import { useState, useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { api } from '../utils/api';
import { fmt$ } from '../utils/helpers';
import KpiCard from '../components/KpiCard';

Chart.register(...registerables);

const WEEKLY_REV  = [878, 942, 1011, 965, 1088, 1034, 1099, 0];
const WEEKLY_COGS = [196, 211, 225,  215, 243,  231,  239,  0];
const WEEK_LABELS = ["Feb 3","Feb 10","Feb 17","Feb 24","Mar 3","Mar 10","Mar 17","This Wk"];

const AnalyticsPage = ({ inventory }) => {
  const barRef  = useRef(null); const barInst  = useRef(null);
  const hbarRef = useRef(null); const hbarInst = useRef(null);
  const [period, setPeriod] = useState("8w");
  const [salesRaw, setSalesRaw] = useState([]);
  const [recipes, setRecipes]   = useState([]);

  useEffect(() => {
    Promise.all([api.getSales(), api.getRecipes()])
      .then(([s, r]) => { setSalesRaw(s); setRecipes(r); })
      .catch(() => {});
  }, []);

  const invMap = useMemo(() => { const m = {}; inventory.forEach(i => m[i.id] = i); return m; }, [inventory]);
  const itemStats = useMemo(() => salesRaw.map(s => {
    const r = recipes.find(x => x.id === s.recipeId);
    const cogs = r ? r.ingredients.reduce((sum, ing) => { const it = invMap[ing.id]; return sum + (it ? ing.qty * it.unitCost : 0); }, 0) : 0;
    const rev = (r?.price || 0) * s.qty;
    const gp = rev - cogs * s.qty;
    return { name: r?.name || "?", icon: r?.icon || "", qty: s.qty, rev, cogs: cogs * s.qty, gp, margin: rev > 0 ? gp / rev * 100 : 0 };
  }).sort((a, b) => b.rev - a.rev), [salesRaw, recipes, invMap]);

  const chartRev    = period === "4w" ? WEEKLY_REV.slice(4)   : WEEKLY_REV;
  const chartCogs   = period === "4w" ? WEEKLY_COGS.slice(4)  : WEEKLY_COGS;
  const chartLabels = period === "4w" ? WEEK_LABELS.slice(4)  : WEEK_LABELS;

  const mtdRev    = WEEKLY_REV.slice(0, 7).reduce((a, b) => a + b, 0) + 1099;
  const avgDaily  = (mtdRev / 28).toFixed(0);
  const bestSeller = itemStats[0];
  const bestMargin = [...itemStats].sort((a, b) => b.margin - a.margin)[0];

  useEffect(() => {
    if (!barRef.current) return;
    if (barInst.current) barInst.current.destroy();
    barInst.current = new Chart(barRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [
          { label: "Revenue", data: chartRev,  backgroundColor: "#f97316", borderRadius: 4, order: 1 },
          { label: "COGS",    data: chartCogs, backgroundColor: "#fcd34d", borderRadius: 4, order: 2 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: ctx => ` ${fmt$(ctx.raw)}` } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: "#f5f5f4" }, ticks: { callback: v => `$${v}` } } },
      }
    });
    return () => { if (barInst.current) barInst.current.destroy(); };
  }, [period]);

  useEffect(() => {
    if (!hbarRef.current) return;
    if (hbarInst.current) hbarInst.current.destroy();
    hbarInst.current = new Chart(hbarRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: itemStats.map(i => `${i.icon} ${i.name}`),
        datasets: [
          { label: "Revenue", data: itemStats.map(i => i.rev),  backgroundColor: "#f97316", borderRadius: 4 },
          { label: "COGS",    data: itemStats.map(i => i.cogs), backgroundColor: "#fcd34d", borderRadius: 4 },
        ]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: ctx => ` ${fmt$(ctx.raw)}` } } },
        scales: { x: { grid: { color: "#f5f5f4" }, ticks: { callback: v => `$${v}` } }, y: { grid: { display: false } } },
      }
    });
    return () => { if (hbarInst.current) hbarInst.current.destroy(); };
  }, [itemStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Analytics</h1>
        <p className="text-stone-400 text-sm mt-0.5">March 2026 · Revenue, COGS & margins</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="MTD Revenue"   value={fmt$(mtdRev)}                           subtitle="March to date"         icon="dashboard" variant="orange" />
        <KpiCard title="Avg Daily Rev" value={fmt$(Number(avgDaily))}                 subtitle="28-day average"        icon="forecast"  variant="blue" />
        <KpiCard title="Best Seller"   value={bestSeller?.name || "—"}                subtitle={`${bestSeller?.qty} covers`} icon="recipes" variant="green" />
        <KpiCard title="Best Margin"   value={`${bestMargin?.margin.toFixed(1)}%`}    subtitle={bestMargin?.name || "—"} icon="forecast" variant="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-700">Weekly Revenue vs COGS</h2>
            <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs font-semibold">
              {[["8w","8 Weeks"],["4w","This Month"]].map(([v, l]) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className={`px-3 py-1.5 transition-colors ${period === v ? "bg-orange-600 text-white" : "text-stone-500 hover:bg-stone-50"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 260 }}><canvas ref={barRef} /></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h2 className="font-semibold text-stone-700 mb-4">Revenue by Item (Today)</h2>
          <div style={{ height: 260 }}><canvas ref={hbarRef} /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">Item Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">COGS</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {itemStats.map((r, i) => {
                const mc = r.margin >= 65 ? "text-emerald-600 bg-emerald-50" : r.margin >= 50 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                return (
                  <tr key={i} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-stone-800">{r.icon} {r.name}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{r.qty}</td>
                    <td className="px-4 py-3 text-right text-stone-700">{fmt$(r.rev)}</td>
                    <td className="px-4 py-3 text-right text-stone-500">{fmt$(r.cogs)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-700">{fmt$(r.gp)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${mc}`}>{r.margin.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
