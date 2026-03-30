import React from 'react';

const StockBar = ({ current, min, max }) => {
  const p = Math.min(100, Math.round(current / max * 100));
  const c = current < min * 0.5 ? "bg-red-500" : current < min ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c}`} style={{ width: `${p}%` }} />
      </div>
      <span className={`text-xs font-medium w-7 text-right ${current < min * 0.5 ? "text-red-600" : current < min ? "text-amber-600" : "text-stone-400"}`}>{p}%</span>
    </div>
  );
};

export default StockBar;
