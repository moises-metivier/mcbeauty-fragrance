import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./auth.css";

export default function Verify2FA() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [factorId, setFactorId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (!totp) return navigate("/admin/2fa", { replace: true });

      setFactorId(totp.id);
      const { data: ch } = await supabase.auth.mfa.challenge({
        factorId: totp.id,
      });
      setChallengeId(ch.id);
    })();
  }, [navigate]);

  const onConfirm = async (e) => {
    e.preventDefault();
    setMsg("");

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    navigate("/admin", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="MC Beauty & Fragrance" />
        </div>

        <h2 className="auth-title">Verificación 2FA</h2>
        <p className="auth-subtitle">
          Ingresa el código de 6 dígitos de tu app autenticadora
        </p>

        <form onSubmit={onConfirm}>
          <input
            className="auth-input code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código 6 dígitos"
          />

          <button className="auth-button" disabled={loading}>
            {loading ? "Verificando..." : "Confirmar"}
          </button>
        </form>

        {msg && <p className="auth-error">{msg}</p>}
      </div>
    </div>
  );
}