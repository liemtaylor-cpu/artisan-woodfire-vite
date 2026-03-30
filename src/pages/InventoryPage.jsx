import React, { useState, useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import StockBar from '../components/StockBar.jsx';
import SupplierChip from '../components/SupplierChip.jsx';
import Modal from '../components/Modal.jsx';
import { CATEGORIES, SUPPLIERS } from '../data/inventory.js';
import { fmt$, fmtNum } from '../utils/helpers.js';
import { api } from '../utils/api.js';

const InventoryPage = ({ inventory, setInventory, addToast, initCtx = {} }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [supplier, setSupplier] = useState("All");
  const [lowStockOnly, setLowStockOnly] = useState(!!initCtx.lowStockOnly);
  const [sortBy, setSortBy] = useState(initCtx.sortBy || "name");
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [showReceive, setShowReceive] = useState(false);
  const [receiveItem, setReceiveItem] = useState(null);
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveNote, setReceiveNote] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let result = inventory.filter(item => {
      const s = item.name.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
      const c = category === "All" || item.category === category;
      const sup = supplier === "All" || item.supplier === supplier;
      const ls = !lowStockOnly || item.currentStock < item.minStock;
      return s && c && sup && ls;
    });
    if (sortBy === "value-desc") result = [...result].sort((a, b) => (b.currentStock * b.unitCost) - (a.currentStock * a.unitCost));
    return result;
  }, [inventory, search, category, supplier, lowStockOnly, sortBy]);

  const startEdit = item => { setEditingId(item.id); setEditVal(String(item.currentStock)); };
  const saveEdit = async id => {
    const v = parseFloat(editVal);
    if (isNaN(v) || v < 0) { setEditingId(null); return; }
    setSaving(true);
    try {
      const updated = await api.updateStock(id, v);
      setInventory(p => p.map(i => i.id === id ? updated : i));
    } catch {
      setInventory(p => p.map(i => i.id === id ? { ...i, currentStock: v } : i));
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const openReceive = item => { setReceiveItem(item); setReceiveQty(""); setReceiveNote(""); setShowReceive(true); };
  const handleReceive = async () => {
    const q = parseFloat(receiveQty);
    if (isNaN(q) || q <= 0) return;
    setSaving(true);
    try {
      const updated = await api.receiveStock(receiveItem.id, q);
      setInventory(p => p.map(i => i.id === receiveItem.id ? updated : i));
      addToast({ type: "success", channel: "#inventory", msg: `📦 Received ${fmtNum(q)} ${receiveItem.unit} of ${receiveItem.name} from ${receiveItem.supplier}. Stock updated.` });
    } catch {
      addToast({ type: "warn", channel: "#inventory", msg: `Failed to update stock for ${receiveItem.name}.` });
    } finally {
      setSaving(false);
      setShowReceive(false);
    }
  };

  const statusOf = item => {
    if (item.currentStock < item.minStock * 0.5) return { label: "Critical", cls: "bg-red-100 text-red-700" };
    if (item.currentStock < item.minStock)        return { label: "Low",      cls: "bg-amber-100 text-amber-700" };
    return { label: "OK", cls: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Inventory</h1>
          <p className="text-stone-400 text-sm mt-0.5">{inventory.length} items · Sam's Club &amp; US Foods</p>
        </div>
        <button onClick={() => setShowReceive(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0">
          <Icon name="download" className="w-4 h-4" />
          Receive Stock
        </button>
      </div>

      {(lowStockOnly || sortBy === "value-desc") && (
        <div className="flex gap-2 flex-wrap">
          {lowStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full">
              Low Stock Only
              <button onClick={() => setLowStockOnly(false)} className="hover:text-red-900 font-bold">×</button>
            </span>
          )}
          {sortBy === "value-desc" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
              Sorted by Value
              <button onClick={() => setSortBy("name")} className="hover:text-emerald-900 font-bold">×</button>
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SUPPLIERS.map(s => (
            <button key={s} onClick={() => setSupplier(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${supplier === s ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${category === c ? "bg-orange-600 text-white" : "bg-white text-stone-600 border border-stone-200 hover:border-orange-300"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr className="text-left text-xs text-stone-500 font-semibold uppercase tracking-wide">
                <th className="px-5 py-3">Item</th>
                <th className="px-3 py-3">Supplier</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3 w-28">Level</th>
                <th className="px-3 py-3">Min/Max</th>
                <th className="px-3 py-3">Unit Cost</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map(item => {
                const st = statusOf(item);
                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-stone-800 whitespace-nowrap">{item.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap"><SupplierChip name={item.supplier} /></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input className="w-16 px-2 py-1 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                            value={editVal} onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditingId(null); }} autoFocus />
                          <span className="text-stone-400 text-xs">{item.unit}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-stone-700">{fmtNum(item.currentStock)} <span className="font-normal text-stone-400 text-xs">{item.unit}</span></span>
                      )}
                    </td>
                    <td className="px-3 py-3 w-28"><StockBar current={item.currentStock} min={item.minStock} max={item.maxStock} /></td>
                    <td className="px-3 py-3 text-stone-400 text-xs whitespace-nowrap">{item.minStock}/{item.maxStock}</td>
                    <td className="px-3 py-3 text-stone-600 whitespace-nowrap">{fmt$(item.unitCost)}</td>
                    <td className="px-3 py-3 text-stone-600 font-medium whitespace-nowrap">{fmt$(item.currentStock * item.unitCost)}</td>
                    <td className="px-3 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button onClick={() => openReceive(item)} title="Receive stock" className="p-1 rounded-lg hover:bg-emerald-100 text-stone-300 hover:text-emerald-600 transition-colors"><Icon name="download" className="w-4 h-4" /></button>
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => saveEdit(item.id)} className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-600"><Icon name="check" className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"><Icon name="x" className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(item)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-300 hover:text-stone-600"><Icon name="edit" className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-stone-400"><p>No items match.</p></div>}
        </div>
      </div>

      {/* Receive Stock Modal */}
      {showReceive && (
        <Modal title="Receive Stock" onClose={() => { setShowReceive(false); setReceiveItem(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Item *</label>
              <select className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                value={receiveItem?.id || ""} onChange={e => setReceiveItem(inventory.find(i => i.id === parseInt(e.target.value)))}>
                <option value="">Select an item…</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.supplier}) — {fmtNum(i.currentStock)} {i.unit} on hand</option>)}
              </select>
            </div>
            {receiveItem && (
              <>
                <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 flex gap-4">
                  <span>Current: <strong className="text-stone-700">{fmtNum(receiveItem.currentStock)} {receiveItem.unit}</strong></span>
                  <span>Min: <strong className="text-stone-700">{receiveItem.minStock}</strong></span>
                  <span>Max: <strong className="text-stone-700">{receiveItem.maxStock}</strong></span>
                  <span><SupplierChip name={receiveItem.supplier} /></span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Quantity Received ({receiveItem.unit}) *</label>
                  <input type="number" min="0" step="0.1"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder={`e.g. ${receiveItem.maxStock - receiveItem.currentStock}`}
                    value={receiveQty} onChange={e => setReceiveQty(e.target.value)} />
                  {receiveQty && !isNaN(parseFloat(receiveQty)) && (
                    <p className="text-xs text-emerald-600 mt-1.5">New stock will be: <strong>{fmtNum(receiveItem.currentStock + parseFloat(receiveQty))} {receiveItem.unit}</strong></p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Note (optional)</label>
                  <input className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Sam's Club run, invoice #1234"
                    value={receiveNote} onChange={e => setReceiveNote(e.target.value)} />
                </div>
              </>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowReceive(false); setReceiveItem(null); }} className="flex-1 py-2.5 text-sm font-medium border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600">Cancel</button>
              <button onClick={handleReceive} disabled={!receiveItem || !receiveQty || isNaN(parseFloat(receiveQty))}
                className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Add to Inventory
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;
