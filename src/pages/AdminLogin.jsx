import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./auth.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("mcbeautyfragrance@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
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

        <h2 className="auth-title">Admin Access</h2>

        <form onSubmit={onSubmit}>
          <input
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
          />

          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />

          <button className="auth-button" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {msg && <p className="auth-error">{msg}</p>}
      </div>
    </div>
  );
}