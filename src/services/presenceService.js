// src/services/presenceService.js
import { supabase } from "../lib/supabaseClient";

let channel = null;

function getSessionId() {
  const KEY = "mc_session_id"; // ← volver al original
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function subscribeToPresence(onChange) {
  const session_id = getSessionId();

  async function markOnline() {
    await supabase.from("online_users").upsert({
      session_id,
      last_seen: new Date().toISOString(),
    });
  }

  async function fetchOnline() {
    const since = new Date(Date.now() - 60 * 1000).toISOString(); // últimos 60s
    const { count, error } = await supabase
      .from("online_users")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", since);

    if (!error) onChange(count || 0);
  }

  // primera marca
  markOnline();
  fetchOnline();

  // heartbeat cada 15s
  const ping = setInterval(() => {
    markOnline();
    fetchOnline();
  }, 15000);

  // 🔴 REALTIME REAL
  channel = supabase
    .channel("online-users")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "online_users" },
      () => fetchOnline()
    )
    .subscribe();

  return () => {
    clearInterval(ping);
    if (channel) supabase.removeChannel(channel);
  };
}