"use client";

import { FormEvent, useState } from "react";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) location.reload();
    else {
      setError((await res.json().catch(() => ({}))).error || "Login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="page admin login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">root@cms</div>
        <h1>Admin access</h1>
        <p className="muted">Sign in to manage portfolio content.</p>
        {!configured && (
          <p className="alert">
            Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> and restart the server.
          </p>
        )}
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
        </label>
        {error && <p className="alert">{error}</p>}
        <button className="btn primary" disabled={loading || !configured}>
          {loading ? "Verifying…" : "Sign in"}
        </button>
        <a className="muted small" href="/">← Back to site</a>
      </form>
    </div>
  );
}
