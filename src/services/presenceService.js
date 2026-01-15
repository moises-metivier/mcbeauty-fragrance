// src/services/presenceService.js
import { supabase } from "../lib/supabaseClient";

let channel = null;

/* ============================= */
/* SESSION ID SEGURO Y COMPATIBLE */
/* ============================= */
function getSessionId() {
  const KEY = "mc_session_id";
  let id = localStorage.getItem(KEY);

  if (!id) {
    // compatible con TODOS los navegadores
    id =
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 10);
    localStorage.setItem(KEY, id);
  }

  return id;
}

/* ================================= */
/* PRESENCE REAL - SOLO PARA HOME    */
/* ================================= */
export function subscribeToPresence(onChange) {
  const session_id = getSessionId();

  /* --------- MARCAR ONLINE --------- */
  async function markOnline() {
    const { error } = await supabase.from("online_users").upsert(
      {
        session_id,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    );

    if (error) {
      console.error("markOnline error:", error.message);
    }
  }

  /* -------- CONTAR ONLINE ---------- */
  async function fetchOnline() {
    const since = new Date(Date.now() - 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from("online_users")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", since);

    if (error) {
      console.error("fetchOnline error:", error.message);
      return;
    }

    onChange(count || 0);
  }

  /* --------- INICIO --------- */
  markOnline();
  fetchOnline();

  /* --------- HEARTBEAT --------- */
  const ping = setInterval(() => {
    markOnline();
    fetchOnline();
  }, 15000);

  /* --------- REALTIME --------- */
  channel = supabase
    .channel("online-users")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "online_users" },
      () => fetchOnline()
    )
    .subscribe();

  /* --------- CLEANUP --------- */
  return () => {
    clearInterval(ping);
    if (channel) supabase.removeChannel(channel);
  };
}