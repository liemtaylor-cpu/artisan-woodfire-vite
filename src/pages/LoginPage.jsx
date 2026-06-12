import Icon from '../components/Icon';

const ROLES = [
  { id: 'owner',    label: 'Owner',    desc: 'Full access — all pages and settings',      icon: '🔥' },
  { id: 'manager',  label: 'Manager',  desc: 'Operations, staff, sales, and inventory',   icon: '📋' },
  { id: 'employee', label: 'Employee', desc: 'Duties, recipes, and daily prep',           icon: '👨‍🍳' },
];

const LoginPage = ({ onLogin }) => {
  const pick = (role) => {
    localStorage.setItem('artisan_role', role);
    onLogin(role);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-orange-500 rounded-2xl">
            <Icon name="fire" className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">Artisan</p>
            <p className="text-stone-400 text-sm">Woodfire Kitchen</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <h2 className="text-stone-800 font-bold text-lg">Who's signing in?</h2>
          <div className="space-y-2">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => pick(r.id)}
                className="w-full flex items-center gap-3 p-4 border border-stone-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl text-left transition-colors group">
                <span className="text-2xl">{r.icon}</span>
                <span>
                  <span className="block font-semibold text-stone-800 text-sm group-hover:text-orange-700">{r.label}</span>
                  <span className="block text-xs text-stone-400">{r.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
