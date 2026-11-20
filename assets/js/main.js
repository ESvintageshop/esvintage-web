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

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderCard(item, cat, idx) {
  const sold = item.disponible === false;
  const img = (item.imagenes && item.imagenes[0]) || "";
  const titulo = escapeHtml(item.titulo);
  const marca = item.marca
    ? `<div class="brand">${escapeHtml(item.marca)}</div>`
    : "";
  const comprarBtn = !sold && item.enlace_compra
    ? `<a class="btn-comprar" href="${escapeHtml(item.enlace_compra)}" target="_blank" rel="noopener">Comprar</a>`
    : "";
  const link = `producto.html?cat=${encodeURIComponent(cat)}&idx=${idx}`;
  return `
    <div class="card${sold ? " sold" : ""}">
      <a class="thumb-link" href="${link}">
        <div class="thumb">${img ? `<img src="${img}" alt="${titulo}" loading="lazy">` : ""}</div>
      </a>
      ${marca}
      <h3><a href="${link}">${titulo}</a></h3>
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
      grid.innerHTML = `<p class="empty-state">Próximamente, nuevas piezas…</p>`;
      return;
    }
    grid.innerHTML = items.map((item, idx) => renderCard(item, active, idx)).join("");
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
    items.forEach((item, idx) => all.push({ item, cat: cat.key, idx }));
  }
  if (all.length === 0) {
    grid.innerHTML = `<p class="empty-state">Próximamente, nuevas piezas…</p>`;
    return;
  }
  all.sort((a, b) => {
    const da = a.item.fecha_subida ? new Date(a.item.fecha_subida).getTime() : 0;
    const db = b.item.fecha_subida ? new Date(b.item.fecha_subida).getTime() : 0;
    return db - da;
  });
  grid.innerHTML = all.slice(0, 4).map(({ item, cat, idx }) => renderCard(item, cat, idx)).join("");
}

async function initAboutPage() {
  const el = document.getElementById("conocenos-text");
  if (!el) return;
  try {
    const res = await fetch("content/conocenos.json?v=" + Date.now());
    const data = await res.json();
    const parrafos = (data.texto || "").split(/\n\s*\n/);
    el.innerHTML = parrafos.map((p) => `<p>${escapeHtml(p.trim())}</p>`).join("");
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

async function initProductoPage() {
  const tituloEl = document.getElementById("producto-titulo");
  if (!tituloEl) return;

  const params = new URLSearchParams(window.location.search);
  const catKey = params.get("cat");
  const idx = parseInt(params.get("idx"), 10);
  const cat = CATEGORIES.find((c) => c.key === catKey);
  const wrap = document.getElementById("producto-wrap");
  const notFound = document.getElementById("producto-no-encontrado");

  if (!cat || Number.isNaN(idx)) {
    if (wrap) wrap.style.display = "none";
    if (notFound) notFound.style.display = "block";
    return;
  }

  const items = await loadCategory(cat);
  const item = items[idx];

  if (!item) {
    if (wrap) wrap.style.display = "none";
    if (notFound) notFound.style.display = "block";
    return;
  }

  document.title = (item.titulo || "Producto") + " — ESvintage";

  const marcaEl = document.getElementById("producto-marca");
  if (marcaEl) marcaEl.textContent = item.marca || "";

  tituloEl.textContent = item.titulo || "";

  const tallaEl = document.getElementById("producto-talla");
  if (tallaEl) {
    if (item.talla) {
      tallaEl.textContent = "Talla: " + item.talla;
      tallaEl.style.display = "block";
    } else {
      tallaEl.style.display = "none";
    }
  }

  const descEl = document.getElementById("producto-descripcion");
  if (descEl) descEl.textContent = item.descripcion || "";

  const sold = item.disponible === false;
  const precioEl = document.getElementById("producto-precio");
  const agotadoEl = document.getElementById("producto-agotado");
  const comprarEl = document.getElementById("producto-comprar");

  if (sold) {
    if (precioEl) precioEl.style.display = "none";
    if (agotadoEl) agotadoEl.style.display = "block";
    if (comprarEl) comprarEl.style.display = "none";
  } else {
    if (precioEl) precioEl.textContent = formatPrice(item.precio);
    if (comprarEl) {
      if (item.enlace_compra) {
        comprarEl.href = item.enlace_compra;
      } else {
        comprarEl.style.display = "none";
      }
    }
  }

  const imagenes = (item.imagenes || []).filter(Boolean);
  const mainImg = document.getElementById("producto-img-principal");
  const miniaturas = document.getElementById("producto-miniaturas");

  if (imagenes.length && mainImg) {
    mainImg.src = imagenes[0];
    mainImg.alt = item.titulo || "";
  }

  if (imagenes.length > 1 && miniaturas) {
    miniaturas.innerHTML = imagenes
      .map((src, i) => `<button type="button" class="miniatura${i === 0 ? " active" : ""}" data-src="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt=""></button>`)
      .join("");
    miniaturas.querySelectorAll(".miniatura").forEach((btn) => {
      btn.addEventListener("click", () => {
        mainImg.src = btn.dataset.src;
        miniaturas.querySelectorAll(".miniatura").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initStore();
  initHomePreview();
  initAboutPage();
  initAjustes();
  initHome();
  initTiendaPage();
  initProductoPage();
});
