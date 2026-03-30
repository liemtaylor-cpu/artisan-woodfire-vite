import React from 'react';

const SupplierChip = ({ name }) => {
  const s = {
    "US Foods":    "bg-blue-50 text-blue-700 border-blue-100",
    "Sam's Club":  "bg-orange-50 text-orange-700 border-orange-100",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${s[name] || "bg-stone-50 text-stone-600 border-stone-200"}`}>
      {name}
    </span>
  );
};

export default SupplierChip;
