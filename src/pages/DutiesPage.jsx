import { useState, useEffect } from 'react';
import { DUTY_LISTS } from '../data/duties';
import { api } from '../utils/api';

const DUTIES_NAME_KEY = "awk_duties_name";

const DutiesPage = ({ addToast }) => {
  const [activeList, setActiveList] = useState("opening");
  const [staffName, setStaffName] = useState(() => localStorage.getItem(DUTIES_NAME_KEY) || "");
  const [checks, setChecks] = useState({});

  // Load shared duty state from API on mount
  useEffect(() => {
    api.getDuties()
      .then(data => setChecks(data || {}))
      .catch(() => {
        try { setChecks(JSON.parse(localStorage.getItem("awk_duties_v1")) || {}); } catch { /* ignore */ }
      });
  }, []);

  const saveChecks = nc => {
    setChecks(nc);
    api.saveDuties(nc).catch(() => {
      // Fallback: persist locally if API is down
      localStorage.setItem("awk_duties_v1", JSON.stringify(nc));
    });
  };

  const saveName = n => { setStaffName(n); localStorage.setItem(DUTIES_NAME_KEY, n); };

  const toggle = (listId, idx) => {
    const cur = checks[listId]?.[idx];
    const nc = { ...checks, [listId]: { ...(checks[listId] || {}), [idx]: cur ? null : {
      by: staffName.trim() || "Staff",
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }}};
    saveChecks(nc);
  };

  const resetList = listId => {
    saveChecks({ ...checks, [listId]: {} });
    addToast({ type: "info", channel: "System", msg: `${DUTY_LISTS.find(d => d.id === listId)?.label} duties reset` });
  };

  const list = DUTY_LISTS.find(d => d.id === activeList);
  const listChecks = checks[activeList] || {};
  const doneCount = list.tasks.filter((_, i) => !!listChecks[i]).length;
  const total = list.tasks.length;
  const pct = Math.round(doneCount / total * 100);
  const allDone = doneCount === total;

  const colorMap = {
    orange: { tab: "bg-orange-600", bar: "bg-orange-500", ring: "ring-orange-200" },
    amber:  { tab: "bg-amber-500",  bar: "bg-amber-400",  ring: "ring-amber-200" },
    blue:   { tab: "bg-blue-600",   bar: "bg-blue-500",   ring: "ring-blue-200" },
    purple: { tab: "bg-purple-600", bar: "bg-purple-500", ring: "ring-purple-200" },
  };
  const c = colorMap[list.color];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Duties</h1>
          <p className="text-stone-400 text-sm mt-0.5">Shared checklists — checks are saved and visible to all staff</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={staffName} onChange={e => saveName(e.target.value)} placeholder="Your name…"
            className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 w-36" />
          <button onClick={() => resetList(activeList)}
            className="px-4 py-2 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 font-medium transition-colors">
            Reset List
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DUTY_LISTS.map(d => {
          const dc = checks[d.id] || {};
          const done = d.tasks.filter((_, i) => !!dc[i]).length;
          const active = activeList === d.id;
          const cc = colorMap[d.color];
          return (
            <button key={d.id} onClick={() => setActiveList(d.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? `${cc.tab} text-white shadow-sm` : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"}`}>
              <span>{d.icon}</span>
              <span>{d.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>{done}/{d.tasks.length}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-stone-800">{list.icon} {list.label} Duties <span className="text-stone-400 font-normal text-sm">· {list.time}</span></p>
            <p className="text-xs text-stone-400 mt-0.5">{doneCount} of {total} tasks complete</p>
          </div>
          {allDone && <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">✓ All done!</span>}
        </div>
        <div className="w-full bg-stone-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all duration-500 ${c.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-stone-400 mt-1.5 text-right">{pct}%</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 divide-y divide-stone-50">
        {list.tasks.map((task, i) => {
          const check = listChecks[i];
          return (
            <button key={i} onClick={() => toggle(activeList, i)}
              className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-stone-50 ${check ? "bg-stone-50/60" : ""}`}>
              <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${check ? `${c.tab} border-transparent` : "border-stone-300"}`}>
                {check && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${check ? "line-through text-stone-400" : "text-stone-700"}`}>{task}</p>
                {check && <p className="text-xs text-stone-400 mt-0.5">✓ {check.by} · {check.at}</p>}
              </div>
              <span className="text-xs font-bold shrink-0 mt-0.5 text-stone-300">#{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DutiesPage;
