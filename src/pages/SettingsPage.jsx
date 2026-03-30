import { useState } from 'react';

const SettingsSection = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-4">
    <h2 className="font-semibold text-stone-700 text-base">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = "text", hint, readOnly }) => (
  <div>
    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange && onChange(e.target.value)}
      readOnly={readOnly}
      className={`w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300 ${readOnly ? "bg-stone-50 text-stone-400 cursor-not-allowed" : ""}`}
    />
    {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
  </div>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div>
      <p className="text-sm font-medium text-stone-700">{label}</p>
      {desc && <p className="text-xs text-stone-400">{desc}</p>}
    </div>
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0 ${value ? "bg-orange-500" : "bg-stone-200"}`}>
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  </div>
);

const SettingsPage = ({ addToast }) => {
  const [store, setStore] = useState({ name: "Artisan Woodfire Kitchen", address: "1842 N Milwaukee Ave, Chicago IL 60647", phone: "(773) 555-0190", taxRate: "10.25" });
  const [shift4, setShift4] = useState({ apiKey: "sk_live_••••••••••••••••4f2a", secret: "••••••••••••••••••••••••", merchantId: "MID-AW-00481", webhook: "https://artisanwoodfire.com/api/shift4/webhook" });
  const [sling, setSling] = useState({ token: "slng_••••••••••••••••8c3d", locationId: "LOC-CHI-001" });
  const [notifs, setNotifs] = useState({ lowStock: true, posSync: true, dailySummary: false, orderReminders: true });
  const [reveal, setReveal] = useState({ shift4Key: false, shift4Secret: false, slingToken: false });

  const save = () => addToast({ type: "success", channel: "System", msg: "Settings saved successfully" });

  const inputCls = "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
          <p className="text-stone-400 text-sm mt-0.5">Integrations, store info & notifications</p>
        </div>
        <button onClick={save}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          Save Changes
        </button>
      </div>

      <SettingsSection title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Restaurant Name" value={store.name}    onChange={v => setStore(s => ({ ...s, name: v }))} />
          <Field label="Phone"           value={store.phone}   onChange={v => setStore(s => ({ ...s, phone: v }))} />
          <Field label="Address"         value={store.address} onChange={v => setStore(s => ({ ...s, address: v }))} />
          <Field label="Tax Rate %"      value={store.taxRate} onChange={v => setStore(s => ({ ...s, taxRate: v }))} hint="Applied to all ticket totals" />
        </div>
      </SettingsSection>

      <SettingsSection title="Shift4 / HarborTouch POS">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-stone-500">Connected · sandbox mode · <span className="font-medium text-stone-700">dev.shift4.com</span></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">API Key</label>
            <div className="flex gap-2">
              <input type={reveal.shift4Key ? "text" : "password"} value={shift4.apiKey} readOnly
                className={`${inputCls} flex-1 bg-stone-50 text-stone-400 cursor-not-allowed`} />
              <button onClick={() => setReveal(r => ({ ...r, shift4Key: !r.shift4Key }))}
                className="px-3 border border-stone-200 rounded-xl text-xs text-stone-500 hover:bg-stone-50 shrink-0">
                {reveal.shift4Key ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Secret Key</label>
            <div className="flex gap-2">
              <input type={reveal.shift4Secret ? "text" : "password"} value={shift4.secret} readOnly
                className={`${inputCls} flex-1 bg-stone-50 text-stone-400 cursor-not-allowed`} />
              <button onClick={() => setReveal(r => ({ ...r, shift4Secret: !r.shift4Secret }))}
                className="px-3 border border-stone-200 rounded-xl text-xs text-stone-500 hover:bg-stone-50 shrink-0">
                {reveal.shift4Secret ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <Field label="Merchant ID"       value={shift4.merchantId} readOnly hint="Assigned by Shift4" />
          <Field label="Webhook Endpoint"  value={shift4.webhook} onChange={v => setShift4(s => ({ ...s, webhook: v }))} hint="Receives live ticket events" />
        </div>
      </SettingsSection>

      <SettingsSection title="Sling Scheduling">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-stone-500">Connected · <span className="font-medium text-stone-700">app.getsling.com</span></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">API Token</label>
            <div className="flex gap-2">
              <input type={reveal.slingToken ? "text" : "password"} value={sling.token} readOnly
                className={`${inputCls} flex-1 bg-stone-50 text-stone-400 cursor-not-allowed`} />
              <button onClick={() => setReveal(r => ({ ...r, slingToken: !r.slingToken }))}
                className="px-3 border border-stone-200 rounded-xl text-xs text-stone-500 hover:bg-stone-50 shrink-0">
                {reveal.slingToken ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <Field label="Location ID" value={sling.locationId} readOnly hint="Your Sling restaurant location" />
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <div className="divide-y divide-stone-50">
          <Toggle label="Low Stock Alerts"    desc="Sling push when an item drops below minimum"      value={notifs.lowStock}       onChange={v => setNotifs(n => ({ ...n, lowStock: v }))} />
          <div className="py-1" />
          <Toggle label="POS Sync Reminders"  desc="Remind to sync Shift4 at start of service"        value={notifs.posSync}        onChange={v => setNotifs(n => ({ ...n, posSync: v }))} />
          <div className="py-1" />
          <Toggle label="Daily Summary"       desc="End-of-day revenue & labor digest via Sling"      value={notifs.dailySummary}   onChange={v => setNotifs(n => ({ ...n, dailySummary: v }))} />
          <div className="py-1" />
          <Toggle label="Order Reminders"     desc="Alert when a PO delivery is due tomorrow"         value={notifs.orderReminders} onChange={v => setNotifs(n => ({ ...n, orderReminders: v }))} />
        </div>
      </SettingsSection>
    </div>
  );
};

export default SettingsPage;
