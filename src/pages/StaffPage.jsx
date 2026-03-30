import { useState } from 'react';
import { STAFF, TODAY_SHIFTS, SLING_MESSAGES } from '../data/staff';
import { TODAY_SALES } from '../data/sales';
import { RECIPES } from '../data/recipes';
import { fmt$ } from '../utils/helpers';
import KpiCard from '../components/KpiCard';
import Icon from '../components/Icon';

const StaffPage = ({ addToast, slingCount, setSlingCount }) => {
  const [sentIdx, setSentIdx] = useState(0);

  const shifts = TODAY_SHIFTS.map(s => ({ ...s, staff: STAFF.find(x => x.id === s.staffId) }));
  const laborToday = shifts.reduce((sum, s) => sum + (s.staff?.rate || 0) * s.hours, 0);
  const todayRev = TODAY_SALES.reduce((sum, s) => { const r = RECIPES.find(x => x.id === s.recipeId); return sum + (r?.price || 0) * s.qty; }, 0);
  const laborPct = todayRev > 0 ? (laborToday / todayRev * 100).toFixed(1) : 0;
  const onClock = shifts.length;

  const sendAlert = () => {
    const msg = SLING_MESSAGES[sentIdx % SLING_MESSAGES.length];
    addToast({ type: "info", channel: "Sling", msg });
    setSentIdx(i => i + 1);
  };

  const roleColor = (role) => {
    if (role.includes("Chef"))   return "bg-orange-100 text-orange-700";
    if (role.includes("Server")) return "bg-blue-100 text-blue-700";
    if (role.includes("Host"))   return "bg-purple-100 text-purple-700";
    return "bg-stone-100 text-stone-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Staff</h1>
          <p className="text-stone-400 text-sm mt-0.5">Sling scheduling · Monday March 30, 2026</p>
        </div>
        <button onClick={sendAlert}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Icon name="sling" className="w-4 h-4" />
          Send Sling Alert
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="On Clock Today" value={onClock}          subtitle={`of ${STAFF.length} total staff`}                                                    icon="dashboard" variant="orange" />
        <KpiCard title="Labor Cost"     value={fmt$(laborToday)} subtitle="Today's shifts"                                                                      icon="inventory"  variant="blue" />
        <KpiCard title="Labor %"        value={`${laborPct}%`}   subtitle={`Target <30% · ${Number(laborPct) < 30 ? "On target" : "Above target"}`}             icon="forecast"   variant={Number(laborPct) < 30 ? "green" : "red"} />
        <KpiCard title="Sling Alerts"   value={slingCount}       subtitle="Sent this session"                                                                   icon="sling"      variant="blue" />
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
                <th className="px-4 py-3 text-right">Labor Cost</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {shifts.map((s, i) => (
                <tr key={i} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-stone-800">{s.staff?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColor(s.staff?.role || "")}`}>{s.staff?.role}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-stone-600">{s.start}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{s.end}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{s.hours}h</td>
                  <td className="px-4 py-3 text-right font-medium text-stone-700">{fmt$((s.staff?.rate || 0) * s.hours)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">Scheduled</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50 font-bold text-stone-800 border-t-2 border-stone-200">
                <td className="px-5 py-3" colSpan={4}>Total</td>
                <td className="px-4 py-3 text-right">{shifts.reduce((a, s) => a + s.hours, 0)}h</td>
                <td className="px-4 py-3 text-right">{fmt$(laborToday)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
        <h2 className="font-semibold text-stone-700 mb-4">Full Roster</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAFF.map(s => (
            <div key={s.id} className={`rounded-xl border p-4 flex items-start gap-3 ${s.status === "active" ? "border-stone-100" : "border-stone-100 opacity-50"}`}>
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-700 font-bold text-sm">
                {s.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-800 text-sm">{s.name}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${roleColor(s.role)}`}>{s.role}</span>
                <p className="text-xs text-stone-400 mt-1">{s.phone} · ${s.rate}/hr</p>
              </div>
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s.status === "active" ? "bg-emerald-400" : "bg-stone-300"}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
