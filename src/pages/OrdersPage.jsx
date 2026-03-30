import { useState, useMemo } from 'react';
import { fmt$ } from '../utils/helpers';
import { api } from '../utils/api';
import Icon from '../components/Icon';
import Badge from '../components/Badge';
import SupplierChip from '../components/SupplierChip';
import Modal from '../components/Modal';

const OrdersPage = ({ orders, setOrders, inventory, setInventory, addToast, initCtx = {} }) => {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState(initCtx.status === "active" ? "Pending" : "All");
  const [activeOnly, setActiveOnly] = useState(initCtx.status === "active");
  const [newOrder, setNewOrder] = useState({ supplier: "US Foods", items: "", total: "", deliveryDate: "" });
  const [receivingId, setReceivingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const statusList = ["All", "Pending", "In Transit", "Delivered"];
  const statusCounts = orders.reduce((m, o) => { m[o.status] = (m[o.status] || 0) + 1; return m; }, {});
  const filtered = useMemo(() => {
    if (activeOnly) return orders.filter(o => o.status === "Pending" || o.status === "In Transit");
    return filterStatus === "All" ? orders : orders.filter(o => o.status === filterStatus);
  }, [orders, filterStatus, activeOnly]);

  const createOrder = async () => {
    if (!newOrder.supplier || !newOrder.total) return;
    setSaving(true);
    try {
      const created = await api.createOrder(newOrder);
      setOrders(p => [created, ...p]);
      addToast({ type: "info", channel: "#orders", msg: `📋 New order ${created.id} submitted to ${created.supplier} for ${fmt$(created.total)}` });
      setShowModal(false);
      setNewOrder({ supplier: "US Foods", items: "", total: "", deliveryDate: "" });
    } catch {
      addToast({ type: "warn", channel: "#orders", msg: "Failed to create order. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await api.updateOrder(id, status);
      setOrders(p => p.map(o => o.id === id ? updated : o));
      addToast({ type: "info", channel: "#orders", msg: `🚚 ${id} is now ${status.toLowerCase()}.` });
    } catch {
      addToast({ type: "warn", channel: "#orders", msg: `Failed to update order ${id}.` });
    }
  };

  const receiveOrder = async id => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    setSaving(true);
    try {
      const updated = await api.updateOrder(id, "Delivered");
      setOrders(p => p.map(o => o.id === id ? updated : o));
      if (order.lineItems?.length) {
        setInventory(p => p.map(item => {
          const line = order.lineItems.find(l => l.id === item.id);
          if (!line) return item;
          return { ...item, currentStock: Math.round((item.currentStock + line.qty) * 100) / 100 };
        }));
        addToast({ type: "success", channel: "#inventory", msg: `📦 ${order.id} from ${order.supplier} marked delivered — inventory updated for ${order.lineItems.length} items.` });
      } else {
        addToast({ type: "success", channel: "#inventory", msg: `📦 ${order.id} from ${order.supplier} marked as delivered.` });
      }
    } catch {
      addToast({ type: "warn", channel: "#orders", msg: `Failed to receive order ${id}.` });
    } finally {
      setSaving(false);
      setReceivingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Purchase Orders</h1>
          <p className="text-stone-400 text-sm mt-0.5">Sam's Club delivery & US Foods</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm shrink-0">
          <Icon name="plus" className="w-4 h-4" />New Order
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[["US Foods", "blue"], ["Sam's Club", "orange"]].map(([s]) => (
          <div key={s} className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
            <p className="text-xs text-stone-500 font-medium">{s}</p>
            <p className="text-xl font-bold text-stone-800 mt-1">{orders.filter(o => o.supplier === s).length}</p>
            <p className="text-xs text-stone-400">total orders</p>
          </div>
        ))}
        <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
          <p className="text-xs text-stone-500 font-medium">Pending / In Transit</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{(statusCounts["Pending"] || 0) + (statusCounts["In Transit"] || 0)}</p>
          <p className="text-xs text-stone-400">awaiting delivery</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
          <p className="text-xs text-stone-500 font-medium">Total Spend (MTD)</p>
          <p className="text-xl font-bold text-stone-800 mt-1">{fmt$(orders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.total, 0))}</p>
          <p className="text-xs text-stone-400">delivered this month</p>
        </div>
      </div>

      {activeOnly && (
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
            Active Orders Only (Pending + In Transit)
            <button onClick={() => setActiveOnly(false)} className="hover:text-blue-900 font-bold">×</button>
          </span>
        </div>
      )}
      {!activeOnly && (
        <div className="flex gap-2 flex-wrap">
          {statusList.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${filterStatus === s ? "bg-orange-600 text-white border-orange-600" : "bg-white border-stone-200 text-stone-500 hover:border-orange-300"}`}>
              {s}{s !== "All" && statusCounts[s] ? ` (${statusCounts[s]})` : s === "All" ? ` (${orders.length})` : ""}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:border-orange-200 transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0"><Icon name="truck" className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-stone-400">{order.id}</span>
                    <Badge status={order.status} />
                    <SupplierChip name={order.supplier} />
                  </div>
                  <p className="text-xs text-stone-400 mt-1.5 truncate">{order.items.join(", ")}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Ordered {order.orderDate} · ETA {order.deliveryDate}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-stone-800">{fmt$(order.total)}</p>
                {order.status === "In Transit" && (
                  <button onClick={() => setReceivingId(order.id)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                    <Icon name="check" className="w-3.5 h-3.5" />Mark Delivered
                  </button>
                )}
                {order.status === "Pending" && (
                  <button onClick={() => updateOrderStatus(order.id, "In Transit")}
                    className="mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors">
                    Mark In Transit
                  </button>
                )}
              </div>
            </div>
            {order.status === "In Transit" && (
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full"><div className="h-full bg-blue-400 rounded-full w-3/5" /></div>
                <span className="text-xs text-blue-500 font-medium shrink-0">In Transit</span>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-stone-400 bg-white rounded-2xl border border-stone-100"><Icon name="orders" className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No {filterStatus !== "All" ? filterStatus.toLowerCase() : ""} orders.</p></div>}
      </div>

      {receivingId && (
        <Modal title="Confirm Delivery" onClose={() => setReceivingId(null)}>
          <div className="space-y-4">
            <p className="text-sm text-stone-600">Mark <strong>{receivingId}</strong> as delivered? This will automatically update inventory for all items in this order.</p>
            {orders.find(o => o.id === receivingId)?.lineItems?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
                Inventory will auto-update for {orders.find(o => o.id === receivingId).lineItems.length} items · Sling notification will be sent to #inventory
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setReceivingId(null)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={() => receiveOrder(receivingId)} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">Confirm Delivery</button>
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal title="New Purchase Order" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Supplier *</label>
              <div className="grid grid-cols-2 gap-2">
                {["US Foods", "Sam's Club"].map(s => (
                  <button key={s} onClick={() => setNewOrder(p => ({ ...p, supplier: s }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${newOrder.supplier === s ? "bg-orange-600 text-white border-orange-600" : "border-stone-200 text-stone-600 hover:border-orange-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Items (comma-separated)</label>
              <input className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="e.g. Fresh Mozzarella, Ricotta" value={newOrder.items} onChange={e => setNewOrder(p => ({ ...p, items: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Total ($) *</label>
                <input type="number" min="0" step="0.01"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="0.00" value={newOrder.total} onChange={e => setNewOrder(p => ({ ...p, total: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Expected Delivery</label>
                <input type="date"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={newOrder.deliveryDate} onChange={e => setNewOrder(p => ({ ...p, deliveryDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={createOrder} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors">Create Order</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrdersPage;
