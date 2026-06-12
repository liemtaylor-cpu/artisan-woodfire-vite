import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../utils/api';
import { fmt$, fmtNum } from '../utils/helpers';
import { RECIPES } from '../data/recipes';
import { parseItemSalesReport, matchItems, computeDeductions } from '../utils/posImport';

const KPI = ({ title, value, subtitle, accent = 'text-stone-800' }) => (
  <div className="bg-white rounded-2xl border border-stone-100 p-4">
    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{title}</p>
    <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
  </div>
);

const ImportSalesPage = ({ inventory, setInventory, addToast }) => {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [adding, setAdding] = useState({});
  const [showAllUnmatched, setShowAllUnmatched] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getRecipes().then(r => setRecipes(r?.length ? r : RECIPES)).catch(() => setRecipes(RECIPES));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      setItems(parseItemSalesReport(text));
      setFileName(file.name);
      setParseError('');
      setApplied(false);
    } catch (e) {
      setItems(null);
      setParseError(e.message);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const { matched, unmatched } = useMemo(
    () => (items ? matchItems(items, recipes) : { matched: [], unmatched: [] }),
    [items, recipes]
  );

  const deductions = useMemo(
    () => computeDeductions(matched, inventory),
    [matched, inventory]
  );

  const totals = useMemo(() => {
    if (!items) return null;
    const netAll = items.reduce((s, i) => s + i.netSales, 0);
    const netMatched = matched.reduce((s, i) => s + i.netSales, 0);
    const qtyMatched = matched.reduce((s, i) => s + i.quantity, 0);
    return { netAll, netMatched, qtyMatched, coverage: netAll ? (netMatched / netAll) * 100 : 0 };
  }, [items, matched]);

  const mappedCount = matched.filter(m => m.recipe.ingredients?.length).length;
  const lowAfter = deductions.filter(d => d.wentLow);

  const applyDeductions = async () => {
    setApplying(true);
    const updates = deductions.map(d => ({ id: d.id, currentStock: d.remaining }));
    const applyLocal = () => setInventory(prev =>
      prev.map(i => {
        const u = updates.find(x => x.id === i.id);
        return u ? { ...i, currentStock: u.currentStock } : i;
      })
    );
    try {
      await api.bulkUpdateInventory(updates);
      applyLocal();
      addToast({ type: 'success', channel: 'Inventory', msg: `Deducted ${updates.length} ingredients from sales import.` });
    } catch {
      applyLocal();
      addToast({ type: 'alert', channel: 'Inventory', msg: 'API unavailable — deductions applied locally only.' });
    }
    if (lowAfter.length) {
      addToast({ type: 'alert', channel: 'Inventory', msg: `${lowAfter.length} item${lowAfter.length > 1 ? 's' : ''} now below min stock: ${lowAfter.map(d => d.name).join(', ')}` });
    }
    setApplied(true);
    setApplying(false);
  };

  const addAsMenuItem = async (item) => {
    setAdding(a => ({ ...a, [item.key]: true }));
    try {
      const created = await api.addRecipe({
        name: item.name, sku: item.name, price: item.menuPrice, icon: '🍽️', ingredients: [],
      });
      setRecipes(prev => [...prev, created]);
      addToast({ type: 'success', channel: 'Recipes', msg: `${item.name} added to menu.` });
    } catch {
      addToast({ type: 'alert', channel: 'Recipes', msg: `Couldn't add ${item.name} — API unavailable.` });
    }
    setAdding(a => ({ ...a, [item.key]: false }));
  };

  const visibleUnmatched = showAllUnmatched ? unmatched : unmatched.slice(0, 15);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Sales Import</h1>
        <p className="text-stone-400 text-sm mt-0.5">Upload a Harbor Touch / Shift4 Item Sales report — revenue and inventory update automatically</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
        <p className="text-4xl mb-2">📥</p>
        <p className="text-stone-600 font-medium text-sm">Drop the Item Sales CSV here, or</p>
        <button onClick={() => fileRef.current?.click()}
          className="mt-3 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Choose File
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />
        <p className="text-xs text-stone-400 mt-3">Harbor Touch back office → Reports → Item Sales → Export CSV</p>
        {fileName && !parseError && <p className="text-xs text-emerald-600 font-medium mt-2">Loaded: {fileName}</p>}
        {parseError && <p className="text-xs text-red-500 font-medium mt-2">{parseError}</p>}
      </div>

      {items && totals && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Net Sales" value={fmt$(totals.netAll)} subtitle="All items on report" accent="text-emerald-600" />
            <KPI title="Matched Revenue" value={fmt$(totals.netMatched)} subtitle={`${totals.coverage.toFixed(0)}% of net sales`} />
            <KPI title="Menu Items Matched" value={`${matched.length} / ${items.length}`} subtitle={`${fmtNum(totals.qtyMatched)} units sold`} />
            <KPI title="Unmatched Items" value={unmatched.length} subtitle="Drinks, retail & unmapped" accent={unmatched.length ? 'text-amber-600' : 'text-stone-800'} />
          </div>

          {/* Inventory deductions */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-bold text-stone-800">Inventory Deductions</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {mappedCount} of {matched.length} matched items have ingredient mappings
                </p>
              </div>
              {deductions.length > 0 && (
                <button onClick={applyDeductions} disabled={applying || applied}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-semibold rounded-xl transition-colors">
                  {applied ? '✓ Applied' : applying ? 'Applying…' : `Apply ${deductions.length} Deductions`}
                </button>
              )}
            </div>

            {deductions.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                No ingredient mappings yet. Open <span className="font-semibold">Recipes</span>, edit a menu item, and add its
                ingredients — future imports will then deduct inventory automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-stone-400 uppercase tracking-wide border-b border-stone-100">
                      <th className="py-2 pr-4">Ingredient</th>
                      <th className="py-2 pr-4 text-right">Current</th>
                      <th className="py-2 pr-4 text-right">Deducted</th>
                      <th className="py-2 pr-4 text-right">Remaining</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductions.map(d => (
                      <tr key={d.id} className="border-b border-stone-50">
                        <td className="py-2 pr-4 font-medium text-stone-700">{d.name}</td>
                        <td className="py-2 pr-4 text-right text-stone-500">{fmtNum(d.current)} {d.unit}</td>
                        <td className="py-2 pr-4 text-right text-red-500 font-medium">−{fmtNum(d.deducted)}</td>
                        <td className="py-2 pr-4 text-right font-semibold text-stone-700">{fmtNum(d.remaining)} {d.unit}</td>
                        <td className="py-2">
                          {d.wentLow && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">LOW</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Matched items */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
            <h2 className="font-bold text-stone-800">Matched Menu Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-stone-400 uppercase tracking-wide border-b border-stone-100">
                    <th className="py-2 pr-4">Item</th>
                    <th className="py-2 pr-4 text-right">Qty Sold</th>
                    <th className="py-2 pr-4 text-right">Net Sales</th>
                    <th className="py-2">Ingredients</th>
                  </tr>
                </thead>
                <tbody>
                  {matched.map(m => (
                    <tr key={m.key} className="border-b border-stone-50">
                      <td className="py-2 pr-4">
                        <span className="mr-1.5">{m.recipe.icon}</span>
                        <span className="font-medium text-stone-700">{m.recipe.name}</span>
                      </td>
                      <td className="py-2 pr-4 text-right text-stone-600">{fmtNum(m.quantity)}</td>
                      <td className="py-2 pr-4 text-right font-medium text-stone-700">{fmt$(m.netSales)}</td>
                      <td className="py-2">
                        {m.recipe.ingredients?.length
                          ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">{m.recipe.ingredients.length} mapped</span>
                          : <span className="px-2 py-0.5 bg-stone-100 text-stone-400 text-xs font-semibold rounded-full">not mapped</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unmatched items */}
          {unmatched.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
              <div>
                <h2 className="font-bold text-stone-800">Unmatched Items</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Not on the menu — mostly bar &amp; retail. Revenue still counts in Net Sales above. Add any item you want tracked.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {visibleUnmatched.map(u => (
                      <tr key={u.key} className="border-b border-stone-50">
                        <td className="py-2 pr-4 font-medium text-stone-600">{u.name}</td>
                        <td className="py-2 pr-4 text-right text-stone-500">{fmtNum(u.quantity)} sold</td>
                        <td className="py-2 pr-4 text-right text-stone-600">{fmt$(u.netSales)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => addAsMenuItem(u)} disabled={adding[u.key]}
                            className="px-3 py-1 text-xs font-semibold text-orange-600 border border-orange-200 hover:bg-orange-50 disabled:opacity-50 rounded-lg transition-colors">
                            {adding[u.key] ? 'Adding…' : '+ Add to menu'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {unmatched.length > 15 && (
                <button onClick={() => setShowAllUnmatched(s => !s)}
                  className="text-xs font-semibold text-stone-500 hover:text-orange-600 transition-colors">
                  {showAllUnmatched ? 'Show less' : `Show all ${unmatched.length} unmatched items`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImportSalesPage;
