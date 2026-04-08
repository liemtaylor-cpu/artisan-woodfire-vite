import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import Icon from '../components/Icon';

const statusBadge = (tx) => {
  if (tx.test) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">TEST</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">LIVE</span>;
};

const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const TransactionsPage = ({ addToast }) => {
  const [txLog, setTxLog]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getTransactions();
      setTxLog(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'alert', channel: 'Transactions', msg: `Failed to load: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setExpanded(e => e === id ? null : id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">POS Transactions</h1>
          <p className="text-stone-400 text-sm mt-0.5">Webhook events received from Shift4</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold rounded-xl transition-colors">
          <Icon name="sync" className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',    value: txLog.length },
          { label: 'Live Events',     value: txLog.filter(t => !t.test).length },
          { label: 'Test Events',     value: txLog.filter(t =>  t.test).length },
          { label: 'Low Stock Fired', value: txLog.reduce((n, t) => n + (t.lowStockAlerts?.length || 0), 0) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      {txLog.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center">
          <Icon name="pos" className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No transactions yet</p>
          <p className="text-stone-400 text-sm mt-1">Use <strong>Fire Test</strong> in Settings to simulate a POS order, or configure your Shift4 webhook to receive live events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txLog.map((tx) => {
            const isOpen = expanded === tx.transaction_id;
            const hasAlerts = tx.lowStockAlerts?.length > 0;
            return (
              <div key={tx.transaction_id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${hasAlerts ? 'border-red-200' : 'border-stone-100'}`}>
                {/* Row */}
                <button onClick={() => toggle(tx.transaction_id)}
                  className="w-full flex flex-wrap items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors">
                  <div className="shrink-0">{statusBadge(tx)}</div>
                  <code className="text-xs text-stone-500 font-mono min-w-0 truncate flex-1">{tx.transaction_id}</code>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {hasAlerts && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                        ⚠ {tx.lowStockAlerts.length} low stock
                      </span>
                    )}
                    <span className="text-xs text-stone-400">{tx.order?.items?.length || 0} items · {tx.deductions?.length || 0} deductions</span>
                    <span className="text-xs text-stone-400">{formatTime(tx.receivedAt)}</span>
                    <Icon name={isOpen ? 'forecast' : 'orders'} className="w-3.5 h-3.5 text-stone-300" />
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-stone-50 space-y-4 pt-3">
                    {/* Order items */}
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Order Items</p>
                      <div className="flex flex-wrap gap-2">
                        {(tx.order?.items || []).map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-medium text-stone-700">
                            {item.sku} × {item.qty}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Inventory deductions */}
                    {tx.deductions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Inventory Deductions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {tx.deductions.map((d, i) => (
                            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${d.wentLow ? 'bg-red-50 border border-red-100' : 'bg-stone-50'}`}>
                              <span className="font-medium text-stone-700">{d.name}</span>
                              <span className={`font-mono ${d.wentLow ? 'text-red-600 font-semibold' : 'text-stone-400'}`}>
                                −{d.deducted} → {d.remaining}
                                {d.wentLow && ' ⚠'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low stock alerts */}
                    {hasAlerts && (
                      <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-red-600">Sling alert sent for: {tx.lowStockAlerts.join(', ')}</p>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-stone-400">
                      <div><span className="font-semibold text-stone-500">Event:</span> {tx.event}</div>
                      <div><span className="font-semibold text-stone-500">Location:</span> {tx.location_id || '—'}</div>
                      <div><span className="font-semibold text-stone-500">Received:</span> {formatTime(tx.receivedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
