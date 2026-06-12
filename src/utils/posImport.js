// Harbor Touch (Shift4) "Item Sales" report import.
// Parses the CSV export, matches line items to menu recipes by SKU/name,
// and computes inventory deductions from recipe ingredient mappings.

const round2 = (n) => Math.round(n * 100) / 100;

const num = (v) => {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Matching is forgiving: case, extra whitespace, and trailing punctuation
// (the report has entries like "Chicken Alfredo Calzone." and "Lolea Spritz Rose:")
export const normalizeItemName = (name) =>
  String(name).toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.,:;]+$/, '');

// Minimal CSV parser with quoted-field support ("Fettuccine Alfredo, Shaved Parm, pita")
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

// Parses the Item Sales report into line items, merging duplicate item names
// (the report repeats an item when it sold at multiple price points).
export function parseItemSalesReport(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('File is empty or has no data rows.');

  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (label) => header.indexOf(label);
  const iItem = col('item'), iPrice = col('menu price'), iQty = col('quantity'),
        iGross = col('gross sales'), iDisc = col('discounts'), iNet = col('net sales');
  if (iItem === -1 || iQty === -1 || iNet === -1) {
    throw new Error('This doesn\'t look like an Item Sales report — expected "Item", "Quantity", and "Net Sales" columns.');
  }

  const merged = new Map();
  for (const r of rows.slice(1)) {
    const name = (r[iItem] || '').trim();
    if (!name) continue;
    const key = normalizeItemName(name);
    const prev = merged.get(key);
    if (prev) {
      prev.quantity   = round2(prev.quantity + num(r[iQty]));
      prev.grossSales = round2(prev.grossSales + num(r[iGross]));
      prev.discounts  = round2(prev.discounts + num(r[iDisc]));
      prev.netSales   = round2(prev.netSales + num(r[iNet]));
    } else {
      merged.set(key, {
        key,
        name,
        menuPrice:  num(r[iPrice]),
        quantity:   round2(num(r[iQty])),
        grossSales: round2(num(r[iGross])),
        discounts:  round2(num(r[iDisc])),
        netSales:   round2(num(r[iNet])),
      });
    }
  }
  return [...merged.values()];
}

// Matches parsed line items to recipes — by SKU first, then by recipe name.
export function matchItems(items, recipes) {
  const lookup = new Map();
  for (const r of recipes) {
    if (r.sku) {
      const k = normalizeItemName(r.sku);
      if (!lookup.has(k)) lookup.set(k, r);
    }
  }
  for (const r of recipes) {
    const k = normalizeItemName(r.name);
    if (!lookup.has(k)) lookup.set(k, r);
  }

  const matched = [], unmatched = [];
  for (const item of items) {
    const recipe = lookup.get(item.key);
    if (recipe) matched.push({ ...item, recipe });
    else unmatched.push(item);
  }
  matched.sort((a, b) => b.netSales - a.netSales);
  unmatched.sort((a, b) => b.netSales - a.netSales);
  return { matched, unmatched };
}

// Aggregates ingredient usage across matched items and returns the inventory
// deduction preview. Only recipes with ingredient mappings contribute.
export function computeDeductions(matched, inventory) {
  const usage = new Map();
  for (const m of matched) {
    for (const ing of (m.recipe.ingredients || [])) {
      usage.set(ing.id, (usage.get(ing.id) || 0) + ing.qty * m.quantity);
    }
  }
  return inventory
    .filter(i => usage.has(i.id))
    .map(i => {
      const deducted  = round2(usage.get(i.id));
      const remaining = round2(Math.max(0, i.currentStock - deducted));
      return {
        id: i.id, name: i.name, unit: i.unit,
        current: i.currentStock, deducted, remaining,
        wentLow: remaining < i.minStock,
      };
    })
    .sort((a, b) => b.deducted / (b.current || 1) - a.deducted / (a.current || 1));
}
