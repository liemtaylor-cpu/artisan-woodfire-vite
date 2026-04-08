import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────

// Password is validated server-side via POST /api/auth/staff.
// No secret is stored in this file.
const AUTH_KEY = 'awk_competency_auth';

const STAFF_LIST = [
  { id: 1, name: 'Marco Ricci',   role: 'Head Pizza Chef' },
  { id: 2, name: 'Sofia Delgado', role: 'Sous Chef' },
  { id: 3, name: 'James Park',    role: 'Line Cook' },
  { id: 4, name: 'Ava Thornton',  role: 'Server' },
  { id: 5, name: 'Luca Ferrante', role: 'Server' },
  { id: 6, name: 'Nina Okafor',   role: 'Host / Cashier' },
  { id: 7, name: 'Derek Walsh',   role: 'Dishwasher' },
];

const SKILLS = [
  { key: 'woodfire',      label: 'Wood Fire / Pit' },
  { key: 'makeSection',   label: 'Make Section' },
  { key: 'saladSection',  label: 'Salad Section' },
  { key: 'expo',          label: 'Expo / Expediting' },
  { key: 'knifeSkills',   label: 'Knife Skills / Prep' },
  { key: 'pizza',         label: 'Pizza / Flatbread' },
  { key: 'speed',         label: 'Speed Under Pressure' },
  { key: 'ticketReading', label: 'Ticket Reading' },
];

const SHIFTS = ['Open', 'Mid', 'Close', 'Off'];

// Which skill keys are "critical stations" and the minimum rating to cover them
const CRITICAL_STATIONS = [
  { label: 'Wood Fire', key: 'woodfire',     threshold: 60 },
  { label: 'Make',      key: 'makeSection',  threshold: 60 },
  { label: 'Salad',     key: 'saladSection', threshold: 55 },
  { label: 'Expo',      key: 'expo',         threshold: 55 },
  { label: 'Pizza',     key: 'pizza',        threshold: 65 },
];

const DEFAULT_COMPETENCIES = {
  1: { woodfire: 92, makeSection: 85, saladSection: 62, expo: 70,  knifeSkills: 78, pizza: 95, speed: 88, ticketReading: 80, shift: 'Close' },
  2: { woodfire: 75, makeSection: 88, saladSection: 80, expo: 82,  knifeSkills: 90, pizza: 70, speed: 84, ticketReading: 86, shift: 'Mid'   },
  3: { woodfire: 68, makeSection: 76, saladSection: 72, expo: 65,  knifeSkills: 74, pizza: 70, speed: 71, ticketReading: 73, shift: 'Open'  },
  4: { woodfire: 42, makeSection: 50, saladSection: 55, expo: 85,  knifeSkills: 48, pizza: 44, speed: 80, ticketReading: 88, shift: 'Close' },
  5: { woodfire: 38, makeSection: 45, saladSection: 52, expo: 82,  knifeSkills: 44, pizza: 40, speed: 78, ticketReading: 85, shift: 'Mid'   },
  6: { woodfire: 30, makeSection: 38, saladSection: 48, expo: 70,  knifeSkills: 42, pizza: 32, speed: 68, ticketReading: 90, shift: 'Off'   },
  7: { woodfire: 52, makeSection: 48, saladSection: 45, expo: 38,  knifeSkills: 55, pizza: 44, speed: 60, ticketReading: 48, shift: 'Close' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcOvr(comp) {
  const vals = SKILLS.map(s => comp[s.key] ?? 50);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function ovrStyle(ovr) {
  if (ovr >= 90) return { bg: 'bg-yellow-400',   text: 'text-yellow-900',  label: 'ELITE' };
  if (ovr >= 80) return { bg: 'bg-emerald-500',   text: 'text-white',       label: 'GOLD'  };
  if (ovr >= 70) return { bg: 'bg-blue-500',      text: 'text-white',       label: 'SILVER'};
  if (ovr >= 60) return { bg: 'bg-amber-400',     text: 'text-amber-900',   label: 'BRONZE'};
  return             { bg: 'bg-stone-400',     text: 'text-white',       label: 'BASIC' };
}

function skillBarColor(val) {
  if (val >= 80) return 'bg-emerald-500';
  if (val >= 65) return 'bg-blue-500';
  if (val >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

function shiftColor(shift) {
  const map = {
    Open:  'bg-sky-100    text-sky-700    border-sky-200',
    Mid:   'bg-amber-100  text-amber-700  border-amber-200',
    Close: 'bg-purple-100 text-purple-700 border-purple-200',
    Off:   'bg-stone-100  text-stone-500  border-stone-200',
  };
  return map[shift] ?? map.Off;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkillSlider({ skillKey, value, onChange }) {
  const barColor = skillBarColor(value);
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 h-5 flex items-center">
        {/* visual track */}
        <div className="absolute inset-x-0 h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${barColor}`}
            style={{ width: `${value}%` }}
          />
        </div>
        {/* invisible range input on top for drag behaviour */}
        <input
          type="range"
          min="1"
          max="99"
          value={value}
          onChange={e => onChange(skillKey, Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '100%' }}
        />
      </div>
      <span className="text-xs font-bold text-stone-600 w-6 text-right tabular-nums">{value}</span>
    </div>
  );
}

function RosterCard({ staff, comp, onChange }) {
  const ovr = calcOvr(comp);
  const { bg, text } = ovrStyle(ovr);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-stone-800 leading-tight">{staff.name}</p>
          <p className="text-xs text-stone-400 mt-0.5">{staff.role}</p>
        </div>
        <div className={`${bg} ${text} rounded-xl px-3 py-1.5 text-center shrink-0`}>
          <p className="text-2xl font-black leading-none tabular-nums">{ovr}</p>
          <p className="text-xs font-bold tracking-widest opacity-70 leading-none mt-0.5">OVR</p>
        </div>
      </div>

      {/* Shift tags */}
      <div className="flex gap-1.5 flex-wrap">
        {SHIFTS.map(s => (
          <button
            key={s}
            onClick={() => onChange(staff.id, 'shift', s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              comp.shift === s
                ? shiftColor(s)
                : 'bg-stone-50 text-stone-400 border-stone-100 hover:border-stone-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Skill bars */}
      <div className="space-y-2">
        {SKILLS.map(skill => (
          <div key={skill.key}>
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-xs text-stone-500 leading-tight">{skill.label}</p>
            </div>
            <SkillSlider
              skillKey={skill.key}
              value={comp[skill.key] ?? 50}
              onChange={(key, val) => onChange(staff.id, key, val)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShiftColumn({ shift, staffList, competencies }) {
  const crew = staffList.filter(s => (competencies[s.id]?.shift ?? 'Off') === shift);

  const stationCoverage = CRITICAL_STATIONS.map(station => {
    const covered = crew.some(s => (competencies[s.id]?.[station.key] ?? 0) >= station.threshold);
    return { ...station, covered };
  });

  const shiftBg = { Open: 'border-sky-200', Mid: 'border-amber-200', Close: 'border-purple-200' }[shift] ?? 'border-stone-200';
  const shiftBadge = shiftColor(shift);

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${shiftBg} flex flex-col gap-4`}>
      {/* Shift header */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${shiftBadge}`}>{shift}</span>
        <span className="text-xs text-stone-400">{crew.length} staff</span>
      </div>

      {/* Crew list */}
      <div className="space-y-2 min-h-[4rem]">
        {crew.length === 0 ? (
          <p className="text-xs text-stone-300 italic">No staff assigned</p>
        ) : (
          crew.map(s => {
            const c = competencies[s.id] ?? {};
            const ovr = calcOvr(c);
            const { bg, text } = ovrStyle(ovr);
            return (
              <div key={s.id} className="flex items-center gap-2.5">
                <div className={`${bg} ${text} text-xs font-black rounded-md px-1.5 py-0.5 tabular-nums shrink-0`}>{ovr}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 leading-tight truncate">{s.name}</p>
                  <p className="text-xs text-stone-400 leading-tight truncate">{s.role}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Station coverage */}
      <div className="border-t border-stone-100 pt-3 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Station Coverage</p>
        {stationCoverage.map(st => (
          <div key={st.key} className="flex items-center justify-between">
            <span className="text-xs text-stone-600">{st.label}</span>
            {st.covered ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                Covered
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Uncovered
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const [checking, setChecking] = useState(false);

  const attempt = async () => {
    if (!input || checking) return;
    setChecking(true);
    try {
      await api.authStaff(input);
      localStorage.setItem(AUTH_KEY, '1');
      onAuth();
    } catch {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1500);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center space-y-1">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-stone-800">Staff Portal</h2>
        <p className="text-stone-400 text-sm">Enter the staff password to continue</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <input
          ref={ref}
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="Password"
          className={`w-full border rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-300 ring-2 ring-red-200 placeholder-red-300'
              : 'border-stone-200 focus:ring-orange-300'
          }`}
        />
        {error && <p className="text-xs text-red-500 text-center font-medium">Incorrect password — try again</p>}
        <button
          onClick={attempt}
          disabled={checking}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {checking ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const StaffCompetencyPage = ({ addToast }) => {
  const [authed, setAuthed]   = useState(() => localStorage.getItem(AUTH_KEY) === '1');
  const [view, setView]       = useState('roster');   // 'roster' | 'shifts'
  const [comps, setComps]     = useState(DEFAULT_COMPETENCIES);
  const saveTimer             = useRef(null);

  // Clean up debounced save timer on unmount
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  useEffect(() => {
    if (!authed) return;
    api.getCompetencies()
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          // Merge API data with defaults so new staff always have ratings
          const merged = { ...DEFAULT_COMPETENCIES };
          Object.entries(data).forEach(([id, comp]) => {
            merged[id] = { ...(merged[id] ?? {}), ...comp };
          });
          setComps(merged);
        }
      })
      .catch(() => { /* stay on defaults */ });
  }, [authed]);

  const handleChange = (staffId, key, val) => {
    setComps(prev => {
      const updated = {
        ...prev,
        [staffId]: { ...(prev[staffId] ?? {}), [key]: val },
      };
      // Debounced save
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api.saveCompetencies(updated).catch(() =>
          addToast({ type: 'alert', channel: 'System', msg: 'Could not save — API unreachable' })
        );
      }, 600);
      return updated;
    });
  };

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

  const avgOvr = Math.round(
    STAFF_LIST.reduce((sum, s) => sum + calcOvr(comps[s.id] ?? {}), 0) / STAFF_LIST.length
  );

  const coverageIssues = ['Open', 'Mid', 'Close'].flatMap(shift => {
    const crew = STAFF_LIST.filter(s => (comps[s.id]?.shift ?? 'Off') === shift);
    return CRITICAL_STATIONS
      .filter(st => !crew.some(s => (comps[s.id]?.[st.key] ?? 0) >= st.threshold))
      .map(st => `${shift}: ${st.label} uncovered`);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Staff Competency</h1>
          <p className="text-stone-400 text-sm mt-0.5">NBA 2K-style skill ratings · drag bars to adjust</p>
        </div>
        <div className="flex items-center gap-2">
          {coverageIssues.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {coverageIssues.length} gap{coverageIssues.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => { localStorage.removeItem(AUTH_KEY); setAuthed(false); }}
            className="px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-400 hover:bg-stone-50 font-medium transition-colors"
          >
            Lock
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Squad OVR</p>
          <p className="text-3xl font-black text-stone-800 tabular-nums">{avgOvr}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Active Staff</p>
          <p className="text-3xl font-black text-stone-800 tabular-nums">
            {STAFF_LIST.filter(s => (comps[s.id]?.shift ?? 'Off') !== 'Off').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Coverage Gaps</p>
          <p className={`text-3xl font-black tabular-nums ${coverageIssues.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {coverageIssues.length}
          </p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {[{ id: 'roster', label: 'Roster & Ratings' }, { id: 'shifts', label: 'Shift View' }].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              view === v.id
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Coverage alert banner */}
      {coverageIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Station coverage gaps detected</p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {coverageIssues.map(issue => (
              <span key={issue} className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Roster View */}
      {view === 'roster' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {STAFF_LIST.map(staff => (
            <RosterCard
              key={staff.id}
              staff={staff}
              comp={comps[staff.id] ?? DEFAULT_COMPETENCIES[staff.id]}
              onChange={handleChange}
            />
          ))}
        </div>
      )}

      {/* Shift View */}
      {view === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Open', 'Mid', 'Close'].map(shift => (
            <ShiftColumn
              key={shift}
              shift={shift}
              staffList={STAFF_LIST}
              competencies={comps}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffCompetencyPage;
