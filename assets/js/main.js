const CATEGORIES = [
  { key: "ropa", label: "Ropa", file: "content/ropa.json" },
  { key: "accesorios", label: "Accesorios", file: "content/accesorios.json" },
  { key: "libros", label: "Libros", file: "content/libros.json" },
];

function formatPrice(value) {
  if (value === undefined || value === null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(2).replace(/\.00$/, "") + " €";
}

function renderCard(item) {
  const sold = item.disponible === false;
  const img = (item.imagenes && item.imagenes[0]) || "";
  return `
    <div class="card${sold ? " sold" : ""}">
      <div class="thumb">${img ? `<img src="${img}" alt="${item.titulo || ""}" loading="lazy">` : ""}</div>
      <h3>${item.titulo || ""}</h3>
      <div class="price">${sold ? '<span class="sold-tag">Vendido</span>' : formatPrice(item.precio)}</div>
    </div>
  `;
}

async function loadCategory(cat) {
  try {
    const res = await fetch(cat.file + "?v=" + Date.now());
    if (!res.ok) throw new Error("no file");
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    return [];
  }
}

async function initStore() {
  const grid = document.getElementById("product-grid");
  const tabs = document.getElementById("cat-tabs");
  if (!grid || !tabs) return;

  const params = new URLSearchParams(window.location.search);
  let active = params.get("cat") || CATEGORIES[0].key;

  const cache = {};
  for (const cat of CATEGORIES) {
    cache[cat.key] = await loadCategory(cat);
  }

  function render() {
    const items = cache[active] || [];
    tabs.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.cat === active);
    });
    if (items.length === 0) {
      grid.innerHTML = `<p class="empty-state">Próximamente nuevas piezas en esta categoría.</p>`;
      return;
    }
    grid.innerHTML = items.map(renderCard).join("");
  }

  tabs.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.cat;
      const url = new URL(window.location);
      url.searchParams.set("cat", active);
      window.history.replaceState({}, "", url);
      render();
    });
  });

  render();
}

async function initHomePreview() {
  const grid = document.getElementById("home-preview-grid");
  if (!grid) return;
  const all = [];
  for (const cat of CATEGORIES) {
    const items = await loadCategory(cat);
    all.push(...items);
  }
  if (all.length === 0) {
    grid.innerHTML = `<p class="empty-state">Muy pronto encontrarás aquí las primeras piezas.</p>`;
    return;
  }
  grid.innerHTML = all.slice(0, 8).map(renderCard).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initStore();
  initHomePreview();
});
