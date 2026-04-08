import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Icon from '../components/Icon';

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
  const [loading,       setLoading]      = useState(true);
  const [saving,        setSaving]       = useState(false);
  const [firingTest,    setFiringTest]   = useState(false);
  const [lastTestResult, setLastTestResult] = useState(null);

  const [storeInfo, setStoreInfo] = useState({ name: 'Artisan Woodfire Kitchen', address: '1842 N Milwaukee Ave, Chicago IL 60647', phone: '(773) 555-0190', taxRate: '10.25' });
  const [notifs, setNotifs] = useState({ lowStock: true, posSync: true, dailySummary: false, orderReminders: true });

  // Integration connection statuses — loaded from /api/health
  const [integrations, setIntegrations] = useState({ shift4: false, shift4Sim: true, sling: false, slingSim: true });

  useEffect(() => {
    // Load saved settings
    api.getSettings()
      .then(data => {
        if (data?.storeName) setStoreInfo({ name: data.storeName, address: data.address || '', phone: data.phone || '', taxRate: String(data.taxRate || '10.25') });
        if (data?.notifications) setNotifs(data.notifications);
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));

    // Check which integrations are configured / simulated
    api.health()
      .then(h => setIntegrations({
        shift4:         h.shift4Configured,
        shift4Sim:      h.shift4Simulated,
        sling:          h.slingConfigured,
        slingSim:       h.slingSimulated,
      }))
      .catch(() => { /* ignore */ });
  }, []);

  const fireTestWebhook = async () => {
    setFiringTest(true);
    setLastTestResult(null);
    try {
      const result = await api.testWebhook();
      setLastTestResult(result);
      addToast({ type: 'success', channel: 'Shift4 Test', msg: `Test order fired — ${result.inventoryUpdates} inventory updates${result.lowStockAlerts?.length ? `, ⚠ ${result.lowStockAlerts.join(', ')} went low` : ''}` });
    } catch (err) {
      addToast({ type: 'alert', channel: 'Shift4 Test', msg: `Test failed: ${err.message}` });
    } finally {
      setFiringTest(false);
    }
  };

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
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className={`w-2 h-2 rounded-full shrink-0 ${integrations.shift4 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {integrations.shift4
            ? <span className="text-xs text-stone-500">Connected · <span className="font-medium text-stone-700">SHIFT4_API_KEY configured</span></span>
            : <span className="text-xs text-stone-500">Not configured · set <code className="bg-stone-100 px-1 rounded text-stone-600">SHIFT4_API_KEY</code> in Vercel env vars</span>
          }
          {integrations.shift4Sim && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">SIMULATION MODE</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Webhook Endpoint" value="https://artisan-woodfire-api.vercel.app/api/webhook/pos" readOnly hint="Point your Shift4 webhook here" />
          <Field label="Webhook events"   value="order.completed" readOnly hint="Only this event type is processed" />
        </div>
        {/* Test webhook fire button */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-medium text-stone-700">Fire Test Order</p>
            <p className="text-xs text-stone-400">Simulate a POS sale — deducts real inventory, triggers Sling alerts</p>
          </div>
          <button onClick={fireTestWebhook} disabled={firingTest}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
            <Icon name={firingTest ? 'sync' : 'pos'} className={`w-3.5 h-3.5 ${firingTest ? 'animate-spin' : ''}`} />
            {firingTest ? 'Firing…' : 'Fire Test'}
          </button>
        </div>

        {lastTestResult && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-stone-600">Last test — <code className="text-stone-400">{lastTestResult.transaction_id}</code></p>
            <div className="flex flex-wrap gap-1.5">
              {lastTestResult.order?.items?.map((item, i) => (
                <span key={i} className="px-2 py-0.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-600 font-medium">
                  {item.sku} × {item.qty}
                </span>
              ))}
            </div>
            {lastTestResult.lowStockAlerts?.length > 0 && (
              <p className="text-xs text-red-600 font-semibold">⚠ Low stock triggered: {lastTestResult.lowStockAlerts.join(', ')}</p>
            )}
            <p className="text-xs text-emerald-600">{lastTestResult.inventoryUpdates} ingredient deductions applied</p>
          </div>
        )}

        {!integrations.shift4 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Add <strong>SHIFT4_API_KEY</strong> and <strong>SHIFT4_WEBHOOK_SECRET</strong> to your Vercel environment variables to enable live POS sync. Get a sandbox key at <strong>dev.shift4.com</strong> → API Keys → Test Mode.
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Sling Scheduling">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className={`w-2 h-2 rounded-full shrink-0 ${integrations.sling ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {integrations.sling
            ? <span className="text-xs text-stone-500">Connected · <span className="font-medium text-stone-700">SLING_API_TOKEN configured</span></span>
            : <span className="text-xs text-stone-500">Not configured · set <code className="bg-stone-100 px-1 rounded text-stone-600">SLING_API_TOKEN</code>, <code className="bg-stone-100 px-1 rounded text-stone-600">SLING_ORG_ID</code>, <code className="bg-stone-100 px-1 rounded text-stone-600">SLING_GROUP_ID</code> in Vercel env vars</span>
          }
          {integrations.slingSim && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">SIMULATION MODE</span>
          )}
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
