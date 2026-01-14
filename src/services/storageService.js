// src/services/storageService.js
import { supabase } from "../lib/supabaseClient";

/**
 * Sube una imagen al bucket "products" (public)
 * y devuelve la URL pública lista para guardar en products.image_url
 */
export async function uploadProductImage(file, opts = {}) {
  const bucket = "products";
  const folder = opts.folder || "products";

  if (!file) throw new Error("No file provided");

  // nombre seguro y único
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;
  const path = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) {
    console.error("uploadProductImage uploadError:", uploadError);
    throw uploadError;
  }

  // URL pública
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) throw new Error("No public URL returned");

  return {
    publicUrl,
    path,
    bucket,
  };
}