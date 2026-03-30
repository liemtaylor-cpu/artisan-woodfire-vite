import React from 'react';

const Badge = ({ status }) => {
  const m = {
    Delivered:   "bg-emerald-100 text-emerald-700",
    "In Transit":"bg-blue-100 text-blue-700",
    Pending:     "bg-amber-100 text-amber-700",
    Cancelled:   "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${m[status] || "bg-stone-100 text-stone-600"}`}>
      {status}
    </span>
  );
};

export default Badge;
