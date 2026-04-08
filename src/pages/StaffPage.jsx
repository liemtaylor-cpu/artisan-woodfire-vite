import { useState, useEffect } from 'react';
import { fmt$ } from '../utils/helpers';
import { api } from '../utils/api';
import KpiCard from '../components/KpiCard';
import Icon from '../components/Icon';

const QUICK_MESSAGES = [
  "Kitchen staff: mise en place starts at 2:30 PM sharp.",
  "All servers: pre-shift meeting at 3:45 PM.",
  "Reminder: wood restock before service — check the back.",
  "Tonight's 86 list will be posted by 4 PM. Check the board.",
];

const SKILLS = [
  'Wood Fire Operation',
  'Dough Prep',
  'Pizza Assembly',
  'Sauce & Toppings',
  'Oven Management',
  'Food Safety',
  'Front of House',
  'Cashier / POS',
  'Food Running',
  'Dishwashing',
];

const ROLES = ['Head Pizza Chef','Sous Chef','Line Cook','Server','Host / Cashier','Dishwasher','Manager','Prep Cook'];

const StaffPage = ({ addToast, slingCount, setSlingCount, hidePayRates = false }) => {
  const [sentIdx, setSentIdx]     = useState(0);
  const [sending, setSending]     = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [staff, setStaff]         = useState([]);
  const [shifts, setShifts]       = useState([]);
  const [salesRaw, setSalesRaw]   = useState([]);
  const [recipes, setRecipes]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [saving, setSaving]             = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    Promise.all([api.getStaff(), api.getSales(), api.getRecipes()])
      .then(([staffData, s, r]) => {
        setStaff(staffData.staff || []);
        setShifts(staffData.shifts || []);
        setSalesRaw(s);
        setRecipes(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const enrichedShifts = shifts.map(s => ({ ...s, staff: staff.find(x => x.id === s.staffId) }));
  const laborToday = enrichedShifts.reduce((sum, s) => sum + (s.staff?.rate || 0) * s.hours, 0);
  const todayRev = salesRaw.reduce((sum, s) => { const r = recipes.find(x => x.id === s.recipeId); return sum + (r?.price || 0) * s.qty; }, 0);
  const laborPct = todayRev > 0 ? (laborToday / todayRev * 100).toFixed(1) : 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const openEdit = (s) => {
    setEditingStaff(s);
    setEditForm({ name: s.name, role: s.role, phone: s.phone, rate: s.rate, status: s.status, skills: s.skills || [] });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated = await api.updateStaff(editingStaff.id, editForm);
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...updated } : s));
      setEditingStaff(null);
      addToast({ type: 'success', channel: 'Staff', msg: `${editForm.name} updated.` });
    } catch {
      addToast({ type: 'alert', channel: 'Staff', msg: 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async () => {
    setSaving(true);
    try {
      const created = await api.addStaff(editForm);
      setStaff(prev => [...prev, created]);
      setShowAddModal(false);
      setEditForm({});
      addToast({ type: 'success', channel: 'Staff', msg: `${created.name} added to roster.` });
    } catch {
      addToast({ type: 'alert', channel: 'Staff', msg: 'Failed to add employee.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (id, name) => {
    if (!window.confirm(`Remove ${name} from roster?`)) return;
    try {
      await api.deleteStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      addToast({ type: 'info', channel: 'Staff', msg: `${name} removed from roster.` });
    } catch {
      addToast({ type: 'alert', channel: 'Staff', msg: 'Delete failed.' });
    }
  };

  const sendAlert = async (message) => {
    setSending(true);
    try {
      const result = await api.sendSlingAlert(message);
      if (result.sent) {
        addToast({ type: 'info', channel: 'Sling', msg: message });
        setSlingCount(n => n + 1);
      }
    } catch (err) {
      // If Sling isn't configured yet, fall back gracefully
      if (err.message?.includes('not configured')) {
        addToast({ type: 'info', channel: 'Sling (local)', msg: message });
        setSlingCount(n => n + 1);
      } else {
        addToast({ type: 'alert', channel: 'Sling', msg: `Send failed: ${err.message}` });
      }
    } finally {
      setSending(false);
    }
  };

  const sendQuick = () => {
    const msg = QUICK_MESSAGES[sentIdx % QUICK_MESSAGES.length];
    setSentIdx(i => i + 1);
    sendAlert(msg);
  };

  const sendCustom = () => {
    if (!customMsg.trim()) return;
    sendAlert(customMsg.trim());
    setCustomMsg('');
    setShowCustom(false);
  };

  const roleColor = (role) => {
    if (role.includes('Chef'))   return 'bg-orange-100 text-orange-700';
    if (role.includes('Server')) return 'bg-blue-100 text-blue-700';
    if (role.includes('Host'))   return 'bg-purple-100 text-purple-700';
    return 'bg-stone-100 text-stone-600';
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-stone-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Staff</h1>
          <p className="text-stone-400 text-sm mt-0.5">Sling scheduling · {today}</p>
        </div>
        <div className="flex items-center gap-2">
          {showCustom ? (
            <>
              <input
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCustom()}
                placeholder="Custom message…"
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-300 w-56"
                autoFocus
              />
              <button onClick={sendCustom} disabled={sending || !customMsg.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                Send
              </button>
              <button onClick={() => setShowCustom(false)}
                className="px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setShowAddModal(true); setEditForm({ name: '', role: '', phone: '', rate: 15, status: 'active', skills: [] }); }}
                className="px-3 py-2.5 border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold rounded-xl transition-colors">
                + Add
              </button>
              <button onClick={() => setShowCustom(true)}
                className="px-3 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-xl transition-colors">
                Custom
              </button>
              <button onClick={sendQuick} disabled={sending}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                <Icon name={sending ? 'sync' : 'sling'} className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
                {sending ? 'Sending…' : 'Send Sling Alert'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="On Clock Today" value={enrichedShifts.length}      subtitle={`of ${staff.length} total staff`}                                                    icon="dashboard" variant="orange" />
        {!hidePayRates && <KpiCard title="Labor Cost"     value={fmt$(laborToday)}   subtitle="Today's shifts"                                                             icon="inventory"  variant="blue" />}
        {!hidePayRates && <KpiCard title="Labor %"        value={`${laborPct}%`}     subtitle={`Target <30% · ${Number(laborPct) < 30 ? 'On target' : 'Above target'}`}   icon="forecast"   variant={Number(laborPct) < 30 ? 'green' : 'red'} />}
        <KpiCard title="Sling Alerts"   value={slingCount}         subtitle="Sent this session"                                                                   icon="sling"      variant="blue" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">Today's Shifts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Start</th>
                <th className="px-4 py-3 text-right">End</th>
                <th className="px-4 py-3 text-right">Hours</th>
                {!hidePayRates && <th className="px-4 py-3 text-right">Labor Cost</th>}
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {enrichedShifts.map((s, i) => (
                <tr key={i} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-stone-800">{s.staff?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColor(s.staff?.role || '')}`}>{s.staff?.role}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-stone-600">{s.start}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{s.end}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{s.hours}h</td>
                  {!hidePayRates && <td className="px-4 py-3 text-right font-medium text-stone-700">{fmt$((s.staff?.rate || 0) * s.hours)}</td>}
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">Scheduled</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50 font-bold text-stone-800 border-t-2 border-stone-200">
                <td className="px-5 py-3" colSpan={4}>Total</td>
                <td className="px-4 py-3 text-right">{enrichedShifts.reduce((a, s) => a + s.hours, 0)}h</td>
                {!hidePayRates && <td className="px-4 py-3 text-right">{fmt$(laborToday)}</td>}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
        <h2 className="font-semibold text-stone-700 mb-4">Full Roster</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map(s => (
            <div key={s.id} className={`rounded-xl border p-4 flex items-start gap-3 ${s.status === 'active' ? 'border-stone-100' : 'border-stone-100 opacity-50'}`}>
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-700 font-bold text-sm">
                {s.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-800 text-sm">{s.name}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${roleColor(s.role)}`}>{s.role}</span>
                <p className="text-xs text-stone-400 mt-1">{s.phone}{!hidePayRates ? ` · $${s.rate}/hr` : ''}</p>
                {s.skills && s.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.skills.slice(0, 3).map(sk => (
                      <span key={sk} className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{sk}</span>
                    ))}
                    {s.skills.length > 3 && <span className="text-xs text-stone-400">+{s.skills.length - 3}</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-400' : 'bg-stone-300'}`} />
                <button onClick={() => openEdit(s)} className="text-xs text-stone-400 hover:text-orange-600 transition-colors font-medium">Edit</button>
                <button onClick={() => deleteEmployee(s.id, s.name)} className="text-xs text-stone-300 hover:text-red-500 transition-colors">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(editingStaff || showAddModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-800 text-lg">{editingStaff ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => { setEditingStaff(null); setShowAddModal(false); }} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Name</label>
              <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Role</label>
              <select value={editForm.role || ''} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="">Select role…</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Phone</label>
              <input value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            {/* Pay rate — only show if !hidePayRates */}
            {!hidePayRates && (
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Hourly Rate ($)</label>
                <input type="number" min="0" step="0.50" value={editForm.rate || ''} onChange={e => setEditForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            )}
            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</label>
              <select value={editForm.status || 'active'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="active">Active</option>
                <option value="off">Inactive</option>
              </select>
            </div>
            {/* Skills */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Skills</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SKILLS.map(skill => (
                  <label key={skill} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={(editForm.skills || []).includes(skill)}
                      onChange={e => setEditForm(f => ({
                        ...f,
                        skills: e.target.checked
                          ? [...(f.skills || []), skill]
                          : (f.skills || []).filter(s => s !== skill)
                      }))}
                      className="rounded text-orange-600 focus:ring-orange-300" />
                    <span className="text-xs text-stone-600">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setEditingStaff(null); setShowAddModal(false); }}
                className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button onClick={editingStaff ? saveEdit : saveNew} disabled={saving || !editForm.name || !editForm.role}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? 'Saving…' : editingStaff ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
