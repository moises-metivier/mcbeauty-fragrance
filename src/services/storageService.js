// src/services/storageService.js
import { supabase } from "../lib/supabaseClient";

export async function uploadProductImage(file, opts = {}) {
  const bucket = "products";
  const folder = opts.folder || "products";

  if (!file) throw new Error("No file provided");

  const isVideo = file.type.startsWith("video");

  const allowedImage = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const allowedVideo = [
    "video/mp4",
    "video/webm"
  ];

  if (
    !allowedImage.includes(file.type) &&
    !allowedVideo.includes(file.type)
  ) {
    throw new Error("Formato no permitido");
  }

  // límite tamaño
  const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      isVideo
        ? "El video es demasiado grande (máx 20MB)"
        : "La imagen es demasiado grande (máx 5MB)"
    );
  }

  // nombre seguro
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";

  const fileName = `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.${safeExt}`;

  const path = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("uploadProductImage uploadError:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  const publicUrl = data?.publicUrl;

  if (!publicUrl) throw new Error("No public URL returned");

  return {
    publicUrl,
    path,
    bucket,
    mediaType: isVideo ? "video" : "image"
  };
}