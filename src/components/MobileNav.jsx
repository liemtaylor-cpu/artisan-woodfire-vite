import React, { useState } from 'react';
import Icon from './Icon.jsx';

const MobileNav = ({ current, onNav, alertCount }) => {
  const [showMore, setShowMore] = useState(false);

  const mainTabs = [
    { id: "dashboard", label: "Home",  icon: "dashboard" },
    { id: "sales",     label: "Sales", icon: "pos" },
    { id: "inventory", label: "Stock", icon: "inventory" },
    { id: "staff",     label: "Staff", icon: "sling" },
  ];
  const moreTabs = [
    { id: "analytics",   label: "Analytics",   icon: "forecast" },
    { id: "recipes",     label: "Recipes",     icon: "recipes" },
    { id: "orders",      label: "Orders",      icon: "orders" },
    { id: "forecasting", label: "Forecasting", icon: "forecast" },
    { id: "duties",      label: "Duties",      icon: "orders" },
    { id: "competency",   label: "Competency",   icon: "check"  },
    { id: "transactions", label: "Transactions", icon: "pos"    },
    { id: "settings",     label: "Settings",     icon: "pos"    },
  ];

  const handleMain = (id) => { onNav(id); setShowMore(false); };

  return (
    <>
      {/* Dimmer behind more sheet */}
      {showMore && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowMore(false)} />}

      {/* More sheet */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 px-4 pt-4 pb-6 lg:hidden">
          <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 px-2 mb-2">More Pages</p>
          <div className="grid grid-cols-2 gap-2">
            {moreTabs.map(t => (
              <button key={t.id} onClick={() => { handleMain(t.id); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${current === t.id ? "bg-orange-50 text-orange-700 border border-orange-200" : "text-stone-600 bg-stone-50 hover:bg-stone-100"}`}>
                <Icon name={t.icon} className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 z-30 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {mainTabs.map(t => (
            <button key={t.id} onClick={() => handleMain(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 relative ${current === t.id ? "text-orange-600" : "text-stone-400"}`}>
              <Icon name={t.icon} className="w-5 h-5" />
              <span className="text-xs font-medium">{t.label}</span>
              {t.id === "inventory" && alertCount > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">{alertCount}</span>
              )}
            </button>
          ))}
          <button onClick={() => setShowMore(m => !m)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 ${showMore || moreTabs.some(t => t.id === current) ? "text-orange-600" : "text-stone-400"}`}>
            <span className="text-base font-bold leading-5">···</span>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
