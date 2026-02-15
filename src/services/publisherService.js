// src/services/publisherService.js
import { supabase } from "../lib/supabaseClient";

function inferMediaType(file) {
  const t = (file?.type || "").toLowerCase();
  if (t.startsWith("video/")) return "video";
  return "image";
}

function extFromName(name = "") {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "bin";
}

export async function uploadMediaFiles(files = []) {
  if (!files.length) return [];

  const uploaded = [];
  for (const file of files) {
    const media_type = inferMediaType(file);
    const ext = extFromName(file.name);
    const ts = Date.now();
    const safeBase = file.name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-\.]/g, "")
      .slice(0, 60);

    const file_path = `publisher/${media_type}s/${ts}_${safeBase || "file"}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("publisher")
      .upload(file_path, file, { upsert: false });

    if (upErr) throw upErr;

    const { data: pub } = supabase.storage
      .from("publisher")
      .getPublicUrl(file_path);

    const file_url = pub?.publicUrl;
    if (!file_url) throw new Error("No se pudo obtener URL pública del archivo.");

    // guardar en tabla publisher_media
    const { data: row, error: insErr } = await supabase
      .from("publisher_media")
      .insert({
        media_type,
        file_url,
        file_path,
        original_name: file.name || null,
      })
      .select()
      .single();

    if (insErr) throw insErr;

    uploaded.push(row);
  }

  return uploaded;
}

export async function createPublisherPost({
  platform,
  post_type,
  caption,
  scheduled_at = null,
  auto_queue = true,
  mediaRows = [],
} = {}) {
  if (!platform) throw new Error("Falta platform");
  if (!post_type) throw new Error("Falta post_type");
  if (!caption && caption !== "") throw new Error("Falta caption");

  // 1) crear post
  const { data: post, error: postErr } = await supabase
    .from("publisher_posts")
    .insert({
      platform,
      post_type,
      caption,
      scheduled_at,
      auto_queue: Boolean(auto_queue),
      status: "pending",
    })
    .select()
    .single();

  if (postErr) throw postErr;

  // 2) link medias
  if (mediaRows?.length) {
    const links = mediaRows.map((m, idx) => ({
      post_id: post.id,
      media_id: m.id,
      sort_order: idx + 1,
    }));

    const { error: linkErr } = await supabase
      .from("publisher_post_media")
      .insert(links);

    if (linkErr) throw linkErr;
  }

  return post;
}

export async function loadPublisherPosts({ limit = 50, status = null } = {}) {
  let q = supabase
    .from("publisher_posts")
    .select(
      `
      *,
      publisher_post_media (
        sort_order,
        publisher_media ( id, media_type, file_url, original_name )
      )
      `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw error;

  // normalizar media
  return (data || []).map((p) => {
    const media = (p.publisher_post_media || [])
      .sort((a, b) => (a.sort_order ?? 1) - (b.sort_order ?? 1))
      .map((x) => x.publisher_media)
      .filter(Boolean);

    return { ...p, media };
  });
}

export async function deletePublisherPost(postId) {
  if (!postId) return;

  // trae medias para borrar archivos
  const { data, error } = await supabase
    .from("publisher_post_media")
    .select("publisher_media ( file_path )")
    .eq("post_id", postId);

  if (error) throw error;

  // borra post (cascade borra relaciones)
  const { error: delErr } = await supabase
    .from("publisher_posts")
    .delete()
    .eq("id", postId);

  if (delErr) throw delErr;

  // borra archivos (best-effort)
  const paths = (data || [])
    .map((x) => x.publisher_media?.file_path)
    .filter(Boolean);

  if (paths.length) {
    await supabase.storage.from("publisher").remove(paths);
  }

  return true;
}