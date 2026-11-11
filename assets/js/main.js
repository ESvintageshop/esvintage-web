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
  const comprarBtn = !sold && item.enlace_compra
    ? `<a class="btn-comprar" href="${item.enlace_compra}" target="_blank" rel="noopener">Comprar</a>`
    : "";
  return `
    <div class="card${sold ? " sold" : ""}">
      <div class="thumb">${img ? `<img src="${img}" alt="${item.titulo || ""}" loading="lazy">` : ""}</div>
      <h3>${item.titulo || ""}</h3>
      <div class="price">${sold ? '<span class="sold-tag">Agotado</span>' : formatPrice(item.precio)}</div>
      ${comprarBtn}
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

async function initAboutPage() {
  const el = document.getElementById("conocenos-text");
  if (!el) return;
  try {
    const res = await fetch("content/conocenos.json?v=" + Date.now());
    const data = await res.json();
    const parrafos = (data.texto || "").split(/\n\s*\n/);
    el.innerHTML = parrafos.map((p) => `<p>${p.trim()}</p>`).join("");
  } catch (e) {
    el.innerHTML = "";
  }
}

async function initAjustes() {
  try {
    const res = await fetch("content/ajustes.json?v=" + Date.now());
    const data = await res.json();

    const navMap = {
      "nav-inicio": data.nav_inicio,
      "nav-productos": data.nav_productos,
      "nav-conocenos": data.nav_conocenos,
    };
    Object.entries(navMap).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    });

    const ig = document.getElementById("social-instagram");
    const tiktok = document.getElementById("social-tiktok");
    const email = document.getElementById("contact-email");
    if (ig && data.instagram) ig.href = data.instagram;
    if (tiktok && data.tiktok) tiktok.href = data.tiktok;
    if (email && data.email) {
      email.href = "mailto:" + data.email;
      email.textContent = data.email;
    }
  } catch (e) {}
}

async function initHome() {
  const heroTitulo = document.getElementById("hero-titulo");
  if (!heroTitulo) return;
  try {
    const res = await fetch("content/home.json?v=" + Date.now());
    const data = await res.json();
    if (data.hero_titulo) heroTitulo.textContent = data.hero_titulo;
    const sub = document.getElementById("hero-subtitulo");
    if (sub && data.hero_subtitulo) sub.textContent = data.hero_subtitulo;
    const btn = document.getElementById("hero-boton");
    if (btn && data.hero_boton) btn.textContent = data.hero_boton;
    const secTitulo = document.getElementById("seccion-titulo");
    if (secTitulo && data.seccion_titulo) secTitulo.textContent = data.seccion_titulo;
  } catch (e) {}
}

async function initTiendaPage() {
  const el = document.getElementById("tienda-titulo");
  if (!el) return;
  try {
    const res = await fetch("content/tienda.json?v=" + Date.now());
    const data = await res.json();
    if (data.titulo) el.textContent = data.titulo;
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  initStore();
  initHomePreview();
  initAboutPage();
  initAjustes();
  initHome();
  initTiendaPage();
});
