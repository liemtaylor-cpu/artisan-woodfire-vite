import React from 'react';
import Icon from './Icon.jsx';

const ToastContainer = ({ toasts, remove }) => (
  <div className="fixed top-4 right-2 left-2 sm:left-auto sm:right-4 sm:w-80 z-[100] space-y-2">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-start gap-3 bg-white border rounded-xl shadow-lg p-4 ${t.exiting ? "toast-exit" : "toast-enter"}`}
        style={{ borderColor: t.type === "warn" ? "#fcd34d" : t.type === "success" ? "#6ee7b7" : "#93c5fd" }}
      >
        <div className={`shrink-0 p-1.5 rounded-lg ${t.type === "warn" ? "bg-amber-50 text-amber-600" : t.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
          <Icon name="sling" className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Sling · {t.channel}</p>
          <p className="text-sm text-stone-700 mt-0.5 leading-snug">{t.msg}</p>
        </div>
        <button onClick={() => remove(t.id)} className="text-stone-300 hover:text-stone-500 shrink-0">
          <Icon name="x" className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

export default ToastContainer;
