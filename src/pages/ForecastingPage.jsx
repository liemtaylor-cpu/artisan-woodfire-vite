import { useState, useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { api } from '../utils/api';
import { linearForecast, fmt$, fmtNum } from '../utils/helpers';
import KpiCard from '../components/KpiCard';
import SupplierChip from '../components/SupplierChip';

Chart.register(...registerables);

const ForecastingPage = ({ inventory }) => {
  const lineRef = useRef(null), lineInst = useRef(null);
  const donutRef = useRef(null), donutInst = useRef(null);
  const [selected, setSelected] = useState("00 Flour");
  const [usageData, setUsageData] = useState({ weeks: [], items: {} });

  useEffect(() => {
    api.getUsageData().then(setUsageData).catch(() => {});
  }, []);

  const FW = 4;
  const hist = usageData.items[selected] || [];
  const fore = linearForecast(hist, FW);
  const avgW = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 0;
  const item = inventory.find(i => i.name === selected);
  const daysLeft = avgW > 0 ? Math.round((item?.currentStock || 0) / avgW * 7) : 0;
  const futW = Array.from({ length: FW }, (_, i) => { const d = new Date(2026, 2, 30 + i * 7); return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`; });

  useEffect(() => {
    if (!lineRef.current) return;
    if (lineInst.current) lineInst.current.destroy();
    lineInst.current = new Chart(lineRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: [...usageData.weeks, ...futW],
        datasets: [
          { label: "Historical", data: [...hist, ...Array(FW).fill(null)], borderColor: "#ea580c", backgroundColor: "rgba(234,88,12,0.07)", borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: "#ea580c", tension: 0.35, fill: true },
          { label: "Forecast", data: [...Array(hist.length - 1).fill(null), hist[hist.length - 1], ...fore], borderColor: "#94a3b8", backgroundColor: "rgba(148,163,184,0.04)", borderWidth: 2, borderDash: [5, 5], pointRadius: 4, pointBackgroundColor: "#94a3b8", tension: 0.35, fill: false },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 12 } } }, tooltip: { mode: "index", intersect: false } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
    });
    return () => { if (lineInst.current) lineInst.current.destroy(); };
  }, [selected]);

  const catVal = useMemo(() => { const m = {}; inventory.forEach(i => { m[i.category] = (m[i.category] || 0) + i.currentStock * i.unitCost; }); return m; }, [inventory]);

  useEffect(() => {
    if (!donutRef.current) return;
    if (donutInst.current) donutInst.current.destroy();
    const labels = Object.keys(catVal);
    donutInst.current = new Chart(donutRef.current.getContext("2d"), {
      type: "doughnut",
      data: { labels, datasets: [{ data: labels.map(k => catVal[k]), backgroundColor: ["#f97316", "#fb923c", "#fdba74", "#a3e635", "#34d399", "#60a5fa"], borderWidth: 0, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 14 } }, tooltip: { callbacks: { label: ctx => ` ${fmt$(ctx.raw)}` } } } },
    });
    return () => { if (donutInst.current) donutInst.current.destroy(); };
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Demand Forecasting</h1>
        <p className="text-stone-400 text-sm mt-0.5">Usage trends and 4-week projections</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Avg Weekly Usage" value={`${avgW.toFixed(1)} ${item?.unit || ""}`} subtitle={`For ${selected}`} icon="forecast" variant="orange" />
        <KpiCard title="4-Week Forecast" value={`${fore.reduce((a, b) => a + b, 0).toFixed(1)} ${item?.unit || ""}`} subtitle="Projected total" icon="forecast" variant="blue" />
        <KpiCard title="Stock Duration" value={`${daysLeft} days`} subtitle="At current burn rate" icon="alert" variant={daysLeft < 14 ? "red" : "green"} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-700">Weekly Usage Trend</h2>
            <select className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-stone-600 bg-white"
              value={selected} onChange={e => setSelected(e.target.value)}>
              {Object.keys(usageData.items).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ height: 280 }}><canvas ref={lineRef} /></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h2 className="font-semibold text-stone-700 mb-4">Inventory Value by Category</h2>
          <div style={{ height: 280 }}><canvas ref={donutRef} /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h2 className="font-semibold text-stone-700 mb-4">Reorder Recommendations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(usageData.items).map(([name, data]) => {
            const inv = inventory.find(i => i.name === name);
            if (!inv) return null;
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const days = Math.round(inv.currentStock / avg * 7);
            const qty = Math.ceil(inv.maxStock - inv.currentStock);
            const urg = days < 7 ? "red" : days < 14 ? "amber" : "green";
            const label = days < 7 ? "Reorder Now" : days < 14 ? "Reorder Soon" : "Well Stocked";
            const bdr = { red: "border-red-200 bg-red-50", amber: "border-amber-200 bg-amber-50", green: "border-emerald-200 bg-emerald-50" }[urg];
            const tc = { red: "text-red-600", amber: "text-amber-600", green: "text-emerald-600" }[urg];
            return (
              <div key={name} className={`rounded-xl p-4 border ${bdr}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-stone-700 text-sm">{name}</p>
                  <span className={`text-xs font-bold whitespace-nowrap ${tc}`}>{label}</span>
                </div>
                <p className="text-xs text-stone-500 mt-2">{days} days remaining</p>
                <p className="text-xs text-stone-500">Order: <strong>{qty} {inv.unit}</strong></p>
                <p className="text-xs mt-1"><SupplierChip name={inv.supplier} /></p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ForecastingPage;
