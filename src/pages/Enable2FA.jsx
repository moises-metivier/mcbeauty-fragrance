// src/pages/Enable2FA.jsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Enable2FA() {
  const [qr, setQr] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const didRun = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (didRun.current) return; // evita doble ejecución (StrictMode)
    didRun.current = true;

    (async () => {
      setMsg("Preparando 2FA...");

      // 0) Si ya existe factor TOTP, no re-crees: manda a verify
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) {
        setMsg("❌ Error listando factores: " + fErr.message);
        return;
      }
      const existing = factors?.totp?.[0];
      if (existing?.id) {
        navigate("/admin/2fa/verify", { replace: true });
        return;
      }

      // 1) Enroll (crear factor) 1
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) {
        setMsg("❌ Error creando 2FA: " + error.message);
        return;
      }

      setQr(data?.totp?.qr_code ?? null);
      setFactorId(data?.id ?? null);

      // 2) Challenge 2
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });
      if (chErr) {
        setMsg("❌ Error creando challenge: " + chErr.message);
        return;
      }

      setChallengeId(ch.id);
      setMsg("📱 Escanea el QR y escribe el código de 6 dígitos");
    })();
  }, [navigate]);

  const onConfirm = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!factorId || !challengeId) {
      setMsg("Falta factor/challenge. Refresca la página.");
      return;
    }

    const clean = code.trim();
    if (clean.length !== 6) {
      setMsg("El código debe tener 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      // 3) Verify 3
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: clean,
      });

      if (error) {
        setMsg(error.message);

        // re-challenge por si expiró
        const { data: ch2 } = await supabase.auth.mfa.challenge({ factorId });
        if (ch2?.id) setChallengeId(ch2.id);

        return;
      }

      // refresca sesión (sube a AAL2)
      await supabase.auth.refreshSession?.();

      navigate("/admin", { replace: true });
    } catch (err) {
      setMsg(err?.message || "Error verificando 2FA");
    } finally {
      setLoading(false);
      setCode("");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>🔐 Activar 2FA</h2>

      {qr ? (
        <div style={{ marginBottom: 12 }}>
          <img src={qr} alt="QR 2FA" />
        </div>
      ) : null}

      <form onSubmit={onConfirm}>
        <input
          placeholder="Código 6 dígitos"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verificando..." : "Confirmar"}
        </button>
      </form>

      {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
    </div>
  );
}