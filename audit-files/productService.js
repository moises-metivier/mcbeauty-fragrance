// src/services/productService.js
import { supabase } from "../lib/supabaseClient";

/**
 * Fuente ÚNICA de productos para:
 * - Home
 * - Category
 * - Admin (si quieres luego)
 *
 * Objetivo:
 * - Siempre devolver brandName y typeName (join)
 * - Evitar lógica duplicada
 * - Escalable a 300+ productos (paginación lista)
 */

function clampInt(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fb;
}

function normalizeAudience(value) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "niño" || v === "nino" || v === "niños" || v === "ninos") return "nino";
  if (v === "mujer" || v === "women") return "mujer";
  if (v === "hombre" || v === "men") return "hombre";
  if (v === "unisex") return "unisex";
  if (v === "otros" || v === "otro") return "otros";
  return v || "";
}

function normalizeProductRow(p) {
  const brandName =
    p?.brands?.name ||
    p?.brandName ||
    "";

  const typeName =
    p?.product_types?.name ||
    p?.typeName ||
    "";

  const aromaName =
    p?.aromas?.name ||
    p?.aromaName ||
    "";

  return {
    id: p.id,
    name: p.name ?? "",
    description: p.description ?? null,
    notes: p.notes ?? null,

    // ❌ category eliminado
    audience: normalizeAudience(p.audience),

    price: Number(p.price ?? 0),
    stock: clampInt(p.stock ?? 0),
    active: Boolean(p.active),

    image_url: p.image_url ?? null,

    sold_count: clampInt(p.sold_count ?? 0),
    show_sold_count: Boolean(p.show_sold_count),

    created_at: p.created_at ?? null,

    // FK reales
    brand_id: p.brand_id ?? null,
    type_id: p.type_id ?? null,
    aroma_id: p.aroma_id ?? null,

    // nombres listos para UI
    brandName,
    typeName,
    aromaName,
  };
}

/**
 * Trae productos para UI pública (Home/Category)
 * - activeOnly: true por defecto
 * - filtros opcionales: audience, typeSlug, aromaId, search
 * - paginación opcional: limit, offset
 */
export async function loadPublicProducts({
  activeOnly = true,
  audience = null,
  typeSlug = null,
  aromaId = null, // ✅ aroma real por UUID
  search = null,
  limit = 200,
  offset = 0,
} = {}) {
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      notes,
      audience,
      price,
      stock,
      active,
      image_url,
      sold_count,
      show_sold_count,
      created_at,

      brand_id,
      type_id,
      aroma_id,

      brands:brand_id ( name ),
      product_types:type_id ( name ),
      aromas:aroma_id ( name )
    `
    )
    .order("created_at", { ascending: false });

  // Solo activos
  if (activeOnly) query = query.eq("active", true);

  // Filtro por público
  if (audience) {
    const a = normalizeAudience(audience);
    if (a) query = query.eq("audience", a);
  }

  // Filtro por tipo (por nombre vía join)
  if (typeSlug) {
    const t = String(typeSlug).toLowerCase().trim();
    if (t) query = query.eq("product_types.name", t);
  }

  // ✅ Filtro por AROMA REAL (UUID)
  if (aromaId) {
    query = query.eq("aroma_id", aromaId);
  }

  // Paginación (para 300+ productos)
  if (Number.isFinite(limit) && Number.isFinite(offset)) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error cargando productos (public):", error);
    throw error;
  }

  let rows = (data || []).map(normalizeProductRow);

  // 🔎 Búsqueda client-side
  const q = String(search || "").toLowerCase().trim();
  if (q) {
    rows = rows.filter((p) => {
      const text = `
        ${p.name}
        ${p.brandName}
        ${p.typeName}
        ${p.aromaName || ""}
        ${p.notes || ""}
        ${p.description || ""}
      `.toLowerCase();

      return text.includes(q);
    });
  }

  return rows;
}

// ==============================
// CARGAR 1 SOLO PRODUCTO (DETAIL)
// ==============================
export async function loadPublicProductById(id) {
  if (!id) return null;

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      notes,
      audience,
      price,
      stock,
      active,
      image_url,
      sold_count,
      show_sold_count,
      created_at,

      brand_id,
      type_id,
      aroma_id,

      brands:brand_id ( name ),
      product_types:type_id ( name ),
      aromas:aroma_id ( name )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error cargando producto por id:", error);
    throw error;
  }

  if (!data) return null;

  return normalizeProductRow(data);
}

/* ==============================
   CRUD ADMIN
================================ */

// Nota: brand_id, type_id y aroma_id son UUID (string). NO conviertas a Number.
export async function loadProductsForAdmin({ limit = 500, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      notes,
      audience,
      price,
      stock,
      active,
      image_url,
      sold_count,
      show_sold_count,
      created_at,

      brand_id,
      type_id,
      aroma_id,

      brands:brand_id ( id, name ),
      product_types:type_id ( id, name ),
      aromas:aroma_id ( id, name )
    `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error cargando productos (admin):", error);
    throw error;
  }

  return (data || []).map((p) => ({
    ...normalizeProductRow(p),

    // para el admin a veces ayuda tener los objetos completos
    brands: p.brands || null,
    product_types: p.product_types || null,
    aromas: p.aromas || null,
  }));
}

export async function createProduct(payload) {
  const { data, error } = await supabase
    .from("products")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creando producto:", error);
    throw error;
  }

  return data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando producto:", error);
    throw error;
  }

  return data;
}

export async function deleteProductById(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando producto:", error);
    throw error;
  }

  return true;
}

// ================================
// ALIAS DE COMPATIBILIDAD PARA ADMIN
// ================================
export async function loadProducts({ limit = 500, offset = 0 } = {}) {
  return loadProductsForAdmin({ limit, offset });
}

export async function resolveOrCreateBrand(name) {
  if (!name) return null;

  const clean = name.trim();

  // 1. Buscar marca existente
  const { data: found } = await supabase
    .from("brands")
    .select("id")
    .ilike("name", clean)
    .limit(1)
    .single();

  if (found?.id) return found.id;

  // 2. Crear si no existe
  const { data, error } = await supabase
    .from("brands")
    .insert({ name: clean })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function resolveOrCreateType(name) {
  if (!name) return null;

  const clean = name.trim().toLowerCase();

  const { data: found } = await supabase
    .from("product_types")
    .select("id")
    .eq("name", clean)
    .limit(1)
    .single();

  if (found?.id) return found.id;

  const { data, error } = await supabase
    .from("product_types")
    .insert({ name: clean })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data.id;
}