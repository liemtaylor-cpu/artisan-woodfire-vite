import React from 'react';
import Icon from './Icon.jsx';

const ROLE_BADGE = {
  owner:    { label: 'Owner',    className: 'bg-orange-500 text-white' },
  manager:  { label: 'Manager',  className: 'bg-blue-500 text-white' },
  employee: { label: 'Employee', className: 'bg-stone-600 text-stone-200' },
};

const NAV_GROUPS = [
  {
    label: 'Management',
    items: [
      { id: 'dashboard', label: 'Dashboard',  icon: 'dashboard' },
      { id: 'sales',     label: 'Live Sales', icon: 'pos' },
      { id: 'analytics', label: 'Analytics',  icon: 'forecast' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'inventory',    label: 'Inventory',     icon: 'inventory' },
      { id: 'recipes',      label: 'Recipes',       icon: 'recipes' },
      { id: 'orders',       label: 'Orders',        icon: 'orders' },
      { id: 'forecasting',  label: 'Forecasting',   icon: 'forecast' },
      { id: 'transactions', label: 'Transactions',  icon: 'pos' },
    ],
  },
  {
    label: 'Team',
    items: [
      { id: 'staff',      label: 'Staff',      icon: 'sling'  },
      { id: 'duties',     label: 'Duties',     icon: 'orders' },
      { id: 'competency', label: 'Competency', icon: 'check'  },
    ],
  },
];

const NavGroup = ({ label, items, current, onNav, alertCount, allowedPages }) => {
  const visible = items.filter(item => allowedPages.includes(item.id));
  if (visible.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="text-stone-600 text-xs font-semibold uppercase tracking-widest px-2 mb-1">{label}</p>
      {visible.map(item => (
        <button key={item.id} onClick={() => onNav(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${current === item.id ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}>
          <Icon name={item.icon} className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.id === 'inventory' && alertCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">{alertCount}</span>
          )}
        </button>
      ))}
    </div>
  );
};

const Sidebar = ({ current, onNav, alertCount, slingCount, role, allowedPages, onLogout }) => {
  const badge = ROLE_BADGE[role];

  return (
    <div className="w-56 bg-stone-900 flex flex-col shrink-0" style={{ minHeight: '100vh' }}>
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-500 rounded-xl"><Icon name="fire" className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Artisan</p>
            <p className="text-stone-400 text-xs leading-tight">Woodfire Kitchen</p>
          </div>
          {badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <NavGroup
            key={group.label}
            label={group.label}
            items={group.items}
            current={current}
            onNav={onNav}
            alertCount={alertCount}
            allowedPages={allowedPages}
          />
        ))}
      </nav>

      <div className="px-3 pb-3 space-y-2">
        <p className="text-stone-600 text-xs font-semibold uppercase tracking-widest px-2 mb-2">Integrations</p>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-stone-800">
          <Icon name="pos" className="w-4 h-4 text-orange-400 shrink-0" />
          <div className="min-w-0"><p className="text-stone-300 text-xs font-medium">Harbortouch</p><p className="text-stone-500 text-xs">POS sync</p></div>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-stone-800">
          <Icon name="sling" className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0"><p className="text-stone-300 text-xs font-medium">Sling</p><p className="text-stone-500 text-xs">{slingCount} alerts sent</p></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-stone-800 space-y-1">
        {allowedPages.includes('settings') && (
          <button onClick={() => onNav('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${current === 'settings' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}>
            <Icon name="pos" className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        )}
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-stone-500 hover:bg-stone-800 hover:text-red-400">
          <Icon name="check" className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
        <p className="text-stone-600 text-xs px-2 pt-1">v2.0 · Spring 2026</p>
      </div>
    </div>
  );
};

export default Sidebar;
