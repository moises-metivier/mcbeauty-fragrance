// src/services/presenceService.js
import { supabase } from "../lib/supabaseClient";

let channel = null;

function getSessionId() {
  const KEY = "mc_session";
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
    const since = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min
    const { count } = await supabase
      .from("online_users")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", since);

    onChange(count || 0);
  }

  markOnline();
  fetchOnline();

  // refrescar cada 20s
  const ping = setInterval(() => {
    markOnline();
    fetchOnline();
  }, 20000);

  // realtime
  channel = supabase
    .channel("online-users")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "online_users" },
      fetchOnline
    )
    .subscribe();

  return () => {
    clearInterval(ping);
    if (channel) supabase.removeChannel(channel);
  };
}
