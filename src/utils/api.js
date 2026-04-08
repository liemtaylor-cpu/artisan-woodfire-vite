const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const key = import.meta.env.VITE_API_KEY;
  if (key) headers['X-API-Key'] = key;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: getHeaders(),
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Inventory
  getInventory:        ()           => request('/inventory'),
  updateStock:         (id, stock)  => request(`/inventory/${id}`, { method: 'PATCH', body: { currentStock: stock } }),
  receiveStock:        (id, qty)    => request('/inventory/receive', { method: 'POST', body: { id, qty } }),
  bulkUpdateInventory: (updates)    => request('/inventory/bulk-update', { method: 'POST', body: { updates } }),

  // Orders
  getOrders:    ()              => request('/orders'),
  createOrder:  (order)         => request('/orders', { method: 'POST', body: order }),
  updateOrder:  (id, status)    => request(`/orders/${id}`, { method: 'PATCH', body: { status } }),

  // Sales
  getSales:  () => request('/sales'),
  syncSales: () => request('/sales/sync', { method: 'POST' }),

  // Staff
  getStaff:       ()        => request('/staff'),
  sendSlingAlert: (message) => request('/staff/alert', { method: 'POST', body: { message } }),
  getLiveShifts:  ()        => request('/staff/shifts/live'),

  // Duties
  getDuties:  ()       => request('/duties'),
  saveDuties: (checks) => request('/duties', { method: 'POST', body: checks }),

  // Competencies
  getCompetencies:  ()     => request('/competencies'),
  saveCompetencies: (data) => request('/competencies', { method: 'POST', body: data }),

  // Settings
  getSettings:  ()        => request('/settings'),
  saveSettings: (payload) => request('/settings', { method: 'POST', body: payload }),

  // Auth
  authStaff: (password) => request('/auth/staff', { method: 'POST', body: { password } }),

  // Health
  health: () => request('/health'),

  // Test webhook — fires a simulated POS order through the full pipeline
  testWebhook: (items) => request('/webhook/test', { method: 'POST', body: items ? { items } : {} }),
};
