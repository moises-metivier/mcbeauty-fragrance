// src/components/RequireAuth.jsx
import { useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // loading | no-session | need-2fa | ok
  const [errorMsg, setErrorMsg] = useState("");

  const check = useCallback(async () => {
    setErrorMsg("");

    // ⏱️ fallback por si algo se queda colgado
    let timeout = setTimeout(() => {
      setStatus("no-session");
      setErrorMsg(
        "Se quedó esperando Supabase. Refresca la página (Ctrl+F5) o revisa consola."
      );
    }, 8000);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("no-session");
        setErrorMsg(error.message);
        return;
      }

      const session = data?.session ?? null;
      if (!session) {
        setStatus("no-session");
        return;
      }

      // AAL: si está en aal1 y puede subir a aal2 -> pide 2FA
      const { data: aal, error: aalErr } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalErr) {
        // por seguridad: si falla el AAL, no te dejes colgado
        setStatus("no-session");
        setErrorMsg(aalErr.message);
        return;
      }

      const mustVerify =
        aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2";

      setStatus(mustVerify ? "need-2fa" : "ok");
    } catch (e) {
      setStatus("no-session");
      setErrorMsg(e?.message || "Error en RequireAuth");
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  // ✅ Re-check también cuando cambie la ruta (CLAVE)
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      setStatus("loading");
      await check();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // login/logout/refresh
      check();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [check, location.pathname]);

  if (status === "loading") {
    return (
      <div style={{ padding: 16 }}>
        Cargando...
        {errorMsg ? (
          <p style={{ color: "crimson", marginTop: 10 }}>{errorMsg}</p>
        ) : null}
      </div>
    );
  }

  // 1) No sesión -> login
  if (status === "no-session") {
    if (location.pathname === "/admin/login") return children;
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // 2) Necesita 2FA -> verify (pero deja pasar /admin/2fa/*)
  if (status === "need-2fa") {
    if (location.pathname.startsWith("/admin/2fa")) return children;
    return <Navigate to="/admin/2fa/verify" replace state={{ from: location }} />;
  }

  // 3) OK
  return children;
}