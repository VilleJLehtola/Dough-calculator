const KEY = "ed.shoppingList.v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { items: [], updatedAt: Date.now() };
  } catch {
    return { items: [], updatedAt: Date.now() };
  }
}

function write(next) {
  const data = { ...next, updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function getList() {
  return read();
}

export function clearList() {
  return write({ items: [] });
}

export function removeItem(id) {
  const cur = read();
  const items = cur.items.filter((x) => x.id !== id);
  return write({ items });
}

export function toggleItem(id) {
  const cur = read();
  const items = cur.items.map((x) =>
    x.id === id ? { ...x, checked: !x.checked } : x
  );
  return write({ items });
}

export function countUnchecked() {
  const cur = read();
  return cur.items.filter((x) => !x.checked).length;
}

export function addItems(rawItems = []) {
  // Normalize, group by (name, unit), sum amount
  const cur = read();
  const map = new Map();

  const norm = (s) => (s || "").toString().trim();
  const keyOf = (n, u) => `${n.toLowerCase()}|${(u || "").toLowerCase()}`;

  [...cur.items, ...rawItems].forEach((it) => {
    const name = norm(it.name);
    if (!name) return;
    const unit = norm(it.unit);
    const amount = Number(it.amount);
    const key = keyOf(name, unit);
    const prev = map.get(key);
    map.set(key, {
      id: prev?.id || key, // stable id
      name,
      unit,
      amount:
        (Number.isFinite(prev?.amount) ? prev.amount : 0) +
        (Number.isFinite(amount) ? amount : 0),
      checked: prev?.checked || false,
    });
  });

  const items = Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return write({ items });
}
