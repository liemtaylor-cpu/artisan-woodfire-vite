import Icon from '../components/Icon';

const EmployeePage = ({ inventory, onNavigate }) => {
  const lowStock = inventory.filter(i => i.currentStock < i.minStock);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Good shift 👋</h1>
        <p className="text-stone-400 text-sm mt-0.5">{today}</p>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Icon name="alert" className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} items running low</p>
            <p className="text-xs text-amber-600 mt-0.5">{lowStock.map(i => i.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate('duties')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-left hover:shadow-md transition-shadow">
          <Icon name="check" className="w-8 h-8 text-orange-500 mb-3" />
          <p className="font-semibold text-stone-800">My Duties</p>
          <p className="text-xs text-stone-400 mt-1">Daily checklist</p>
        </button>
        <button onClick={() => onNavigate('recipes')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-left hover:shadow-md transition-shadow">
          <Icon name="recipes" className="w-8 h-8 text-orange-500 mb-3" />
          <p className="font-semibold text-stone-800">Recipes</p>
          <p className="text-xs text-stone-400 mt-1">Kitchen reference</p>
        </button>
      </div>
    </div>
  );
};

export default EmployeePage;
