import React from 'react';
import Icon from './Icon.jsx';

const KpiCard = ({ title, value, subtitle, icon, variant = "orange", onClick }) => {
  const c = {
    orange: "bg-orange-50 text-orange-600",
    red:    "bg-red-50 text-red-600",
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-emerald-50 text-emerald-600",
    amber:  "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  }[variant] || "bg-orange-50 text-orange-600";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-stone-100 ${onClick ? "cursor-pointer hover:shadow-md hover:border-stone-200 transition-all" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-stone-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-stone-800 mt-1 leading-tight">{value}</p>
          {subtitle && <p className="text-xs text-stone-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${c}`}>
          <Icon name={icon} />
        </div>
      </div>
      {onClick && <p className="text-xs text-stone-400 mt-3 font-medium">Tap to view →</p>}
    </div>
  );
};

export default KpiCard;
