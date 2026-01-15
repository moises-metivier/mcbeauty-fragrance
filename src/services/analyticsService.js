// src/services/analyticsService.js
import { supabase } from "../lib/supabaseClient";
import { normalizeText, applyAliases } from "./searchAnalyticsService";

/**
 * Reglas:
 * - NO contar /admin (ni sub-rutas)
 * - NO contar /event/* (eventos internos)
 * - Guardar entity_type + entity_id cuando aplique (product, category, etc.)
 *
 * Requiere en DB (page_views):
 * - id uuid
 * - path text
 * - session_id text (opcional)
 * - entity_type text (opcional)
 * - entity_id uuid (opcional)
 * - created_at timestamptz default now()
 */

// -------------------- Helpers --------------------
function isExcludedPath(path = "") {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/event/") ||
    path.startsWith("/_")
  );
}

// ✅ Soporta ambos keys para NO romper nada:
// - Product.jsx tuyo usa "mc_session"
// - analytics viejo usa "mc_session_id"
function getSessionId() {
  const KEY_A = "mc_session";
  const KEY_B = "mc_session_id";

  let id = localStorage.getItem(KEY_A) || localStorage.getItem(KEY_B);

  if (!id) {
    id = crypto.randomUUID();
  }

  // Guardar en ambos para que todo quede unificado
  localStorage.setItem(KEY_A, id);
  localStorage.setItem(KEY_B, id);

  return id;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0=domingo
  const diffToMonday = (day === 0 ? -6 : 1) - day; // lunes como inicio
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// -------------------- Page Views --------------------
export async function trackPageView(
  path = "/",
  entity_type = null,
  entity_id = null,
  session_id = null
) {
  try {
    if (!path) return;
    if (isExcludedPath(path)) return;

    // Guard: si hay entity_type pero no entity_id, no insertamos
    if (entity_type && !entity_id) {
      console.warn("Page view skipped: entity_type without entity_id", {
        path,
        entity_type,
      });
      return;
    }

    const payload = {
      path,
      entity_type,
      entity_id,
      session_id: session_id || getSessionId(),
      day: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      // 👇 NO views
      // 👇 NO upsert
    };

    // ✅ UNA FILA = UNA VISTA
    const { error } = await supabase.from("page_views").insert([payload]);

    if (error) throw error;
  } catch (e) {
    console.warn("trackPageView error:", e?.message || e);
  }
}

// -------------------- Counters --------------------
export async function getTotalVisits() {
  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

export async function getTodayVisits() {
  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfTodayISO());

  if (error) throw error;
  return count || 0;
}

export async function getYesterdayVisits() {
  const start = startOfYesterdayISO();
  const end = startOfTodayISO();

  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw error;
  return count || 0;
}

export async function getThisWeekVisits() {
  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfWeekISO());

  if (error) throw error;
  return count || 0;
}

export async function getThisMonthVisits() {
  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonthISO());

  if (error) throw error;
  return count || 0;
}

/**
 * Visitas SOLO de tienda (excluye /admin y /event)
 */
export async function getTodayStoreVisits() {
  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfTodayISO())
    .not("path", "ilike", "/admin%")
    .not("path", "ilike", "/event/%");

  if (error) throw error;
  return count || 0;
}

/**
 * KPI Personas reales = visitantes únicos por session_id
 */
export async function getUniqueVisitorsToday() {
  const start = startOfTodayISO();

  const { data, error } = await supabase
    .from("page_views")
    .select("session_id")
    .gte("created_at", start)
    .not("session_id", "is", null);

  if (error) throw error;

  const unique = new Set((data || []).map((r) => r.session_id));
  return unique.size;
}

export async function getUniqueVisitorsThisWeek() {
  const start = startOfWeekISO();

  const { data, error } = await supabase
    .from("page_views")
    .select("session_id")
    .gte("created_at", start)
    .not("session_id", "is", null);

  if (error) throw error;

  const unique = new Set((data || []).map((r) => r.session_id));
  return unique.size;
}

export async function getUniqueVisitorsThisMonth() {
  const start = startOfMonthISO();

  const { data, error } = await supabase
    .from("page_views")
    .select("session_id")
    .gte("created_at", start)
    .not("session_id", "is", null);

  if (error) throw error;

  const unique = new Set((data || []).map((r) => r.session_id));
  return unique.size;
}

// -------------------- Top Pages --------------------
export async function getTopPages({ limit = 10, excludeAdmin = true } = {}) {
  const { data, error } = await supabase
    .from("page_views")
    .select("path")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;

  const map = {};
  for (const row of data || []) {
    const p = row.path || "/";
    if (excludeAdmin && isExcludedPath(p)) continue;
    map[p] = (map[p] || 0) + 1;
  }

  return Object.entries(map)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export async function getTopViewedProducts({ limit = 10 } = {}) {
  const { data, error } = await supabase
    .from("page_views")
    .select("entity_id")
    .eq("entity_type", "product")
    .not("entity_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw error;

  const countMap = {};
  for (const row of data || []) {
    const id = row.entity_id;
    if (!id) continue;
    countMap[id] = (countMap[id] || 0) + 1;
  }

  const topIds = Object.entries(countMap)
    .map(([product_id, views]) => ({ product_id, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);

  if (topIds.length === 0) return [];

  const ids = topIds.map((x) => x.product_id);

  const { data: products, error: err2 } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      image_url,
      price,
      stock,
      active,
      brands(name),
      product_types(name)
    `
    )
    .in("id", ids);

  if (err2) throw err2;

  const byId = new Map((products || []).map((p) => [p.id, p]));

  return topIds.map(({ product_id, views }) => ({
    product_id,
    views,
    product: byId.get(product_id) || null,
  }));
}

// -------------------- Search Analytics --------------------
export async function getTopSearches({ limit = 10 } = {}) {
  try {
    const { data, error } = await supabase
      .from("search_logs")
      .select("query, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) throw error;

    const map = {};
    (data || []).forEach((row) => {
      const q = normalizeText(row.query);
      map[q] = (map[q] || 0) + 1;
    });

    return Object.entries(map)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (e) {
    console.error("Error obteniendo top búsquedas:", e?.message || e);
    return [];
  }
}

export async function getMissingSearches({ limit = 10 } = {}) {
  try {
    const { data: searches, error } = await supabase
      .from("search_logs")
      .select("query, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw error;

    const countMap = {};
    (searches || []).forEach((s) => {
      countMap[s.query] = (countMap[s.query] || 0) + 1;
    });

    const { data: products } = await supabase
      .from("products")
      .select("name")
      .eq("active", true)
      .gt("stock", 0);

    const productText = (products || [])
      .map((p) => applyAliases(normalizeText(p.name)))
      .join(" ");

    const consolidated = {};

    for (const [query, count] of Object.entries(countMap)) {
      const canonical = applyAliases(normalizeText(query));

      if (productText.includes(canonical)) continue;

      if (!consolidated[canonical]) {
        consolidated[canonical] = { canonical, total: 0, variants: {} };
      }

      consolidated[canonical].total += count;
      consolidated[canonical].variants[query] =
        (consolidated[canonical].variants[query] || 0) + count;
    }

    return Object.values(consolidated)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  } catch (e) {
    console.error("Error detectando búsquedas faltantes:", e?.message || e);
    return [];
  }
}

/* ============================= */
/* MÉTRICAS POR PRODUCTO (VISTAS) */
/* ============================= */

export async function getProductMetrics() {
  try {
    const { data, error } = await supabase
      .from("page_views")
      .select("entity_id")
      .eq("entity_type", "product")
      .not("entity_id", "is", null);

    if (error) throw error;

    const map = {};
    (data || []).forEach((r) => {
      const id = r.entity_id;
      if (!id) return;
      map[id] = (map[id] || 0) + 1;
    });

    return Object.entries(map).map(([product_id, views]) => ({
      product_id,
      views,
    }));
  } catch (e) {
    console.error("Error cargando métrricas de productos:", e?.message || e);
    return [];
  }
}

// ✅ Productos activos con 0 vistas (o pocas vistas)
export async function getProductsWithViewCounts() {
  // 1) Traemos productos activos (catálogo real)
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select(`
      id,
      name,
      image_url,
      price,
      stock,
      active,
      brands(name),
      product_types(name)
    `)
    .eq("active", true);

  if (pErr) throw pErr;

  // 2) Traemos vistas por producto desde page_views
  const { data: views, error: vErr } = await supabase
    .from("page_views")
    .select("entity_id")
    .eq("entity_type", "product")
    .not("entity_id", "is", null);

  if (vErr) throw vErr;

  const viewMap = {};
  (views || []).forEach((r) => {
    const id = r.entity_id;
    if (!id) return;
    viewMap[id] = (viewMap[id] || 0) + 1;
  });

  // 3) Unimos producto + views
  return (products || []).map((p) => ({
    product: p,
    views: viewMap[p.id] || 0,
  }));
}

export async function getZeroViewedProducts({ limit = 20 } = {}) {
  const list = await getProductsWithViewCounts();
  return list
    .filter((x) => (x.views || 0) === 0)
    .sort((a, b) => (b.product?.stock || 0) - (a.product?.stock || 0))
    .slice(0, limit);
}

export async function getLowViewedProducts({ limit = 20, maxViews = 3 } = {}) {
  const list = await getProductsWithViewCounts();
  return list
    .filter((x) => (x.views || 0) > 0 && (x.views || 0) <= maxViews)
    .sort((a, b) => (a.views || 0) - (b.views || 0))
    .slice(0, limit);
}