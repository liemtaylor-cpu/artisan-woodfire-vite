import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const SettingsSection = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-4">
    <h2 className="font-semibold text-stone-700 text-base">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = 'text', hint, readOnly }) => (
  <div>
    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange && onChange(e.target.value)}
      readOnly={readOnly}
      className={`w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300 ${readOnly ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : ''}`}
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
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-orange-500' : 'bg-stone-200'}`}>
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

const SettingsPage = ({ addToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [storeInfo, setStoreInfo] = useState({ name: 'Artisan Woodfire Kitchen', address: '1842 N Milwaukee Ave, Chicago IL 60647', phone: '(773) 555-0190', taxRate: '10.25' });
  const [notifs, setNotifs] = useState({ lowStock: true, posSync: true, dailySummary: false, orderReminders: true });

  // Integration connection statuses — loaded from /api/health
  const [integrations, setIntegrations] = useState({ shift4: false, sling: false });

  useEffect(() => {
    // Load saved settings
    api.getSettings()
      .then(data => {
        if (data?.storeName) setStoreInfo({ name: data.storeName, address: data.address || '', phone: data.phone || '', taxRate: String(data.taxRate || '10.25') });
        if (data?.notifications) setNotifs(data.notifications);
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));

    // Check which integrations are configured
    api.health()
      .then(h => setIntegrations({ shift4: h.shift4Configured, sling: h.slingConfigured }))
      .catch(() => { /* ignore */ });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.saveSettings({
        storeName: storeInfo.name,
        address:   storeInfo.address,
        phone:     storeInfo.phone,
        taxRate:   storeInfo.taxRate,
        notifications: notifs,
      });
      addToast({ type: 'success', channel: 'System', msg: 'Settings saved successfully' });
    } catch (err) {
      addToast({ type: 'alert', channel: 'System', msg: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
          <p className="text-stone-400 text-sm mt-0.5">Integrations, store info & notifications</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <SettingsSection title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Restaurant Name" value={storeInfo.name}    onChange={v => setStoreInfo(s => ({ ...s, name: v }))} />
          <Field label="Phone"           value={storeInfo.phone}   onChange={v => setStoreInfo(s => ({ ...s, phone: v }))} />
          <Field label="Address"         value={storeInfo.address} onChange={v => setStoreInfo(s => ({ ...s, address: v }))} />
          <Field label="Tax Rate %"      value={storeInfo.taxRate} onChange={v => setStoreInfo(s => ({ ...s, taxRate: v }))} hint="Applied to all ticket totals" />
        </div>
      </SettingsSection>

      <SettingsSection title="Shift4 / HarborTouch POS">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${integrations.shift4 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-xs text-stone-500">
            {integrations.shift4
              ? <span>Connected · <span className="font-medium text-stone-700">SHIFT4_API_KEY configured</span></span>
              : <span>Not configured · set <code className="bg-stone-100 px-1 rounded text-stone-600">SHIFT4_API_KEY</code> and <code className="bg-stone-100 px-1 rounded text-stone-600">SHIFT4_WEBHOOK_SECRET</code> in Vercel env vars</span>
            }
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Webhook Endpoint" value="https://artisan-woodfire-api.vercel.app/api/webhook/pos" readOnly hint="Point your Shift4 webhook here" />
          <Field label="Webhook events"   value="order.completed" readOnly hint="Only this event type is processed" />
        </div>
        {!integrations.shift4 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Add <strong>SHIFT4_API_KEY</strong> and <strong>SHIFT4_WEBHOOK_SECRET</strong> to your Vercel environment variables to enable live POS sync.
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Sling Scheduling">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${integrations.sling ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-xs text-stone-500">
            {integrations.sling
              ? <span>Connected · <span className="font-medium text-stone-700">SLING_API_TOKEN configured</span></span>
              : <span>Not configured · set <code className="bg-stone-100 px-1 rounded text-stone-600">SLING_API_TOKEN</code>, <code className="bg-stone-100 px-1 rounded text-stone-600">SLING_ORG_ID</code>, and <code className="bg-stone-100 px-1 rounded text-stone-600">SLING_GROUP_ID</code> in Vercel env vars</span>
            }
          </span>
        </div>
        {!integrations.sling && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Add <strong>SLING_API_TOKEN</strong>, <strong>SLING_ORG_ID</strong>, and <strong>SLING_GROUP_ID</strong> to your Vercel environment variables to send real shift alerts.
          </div>
        )}
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
