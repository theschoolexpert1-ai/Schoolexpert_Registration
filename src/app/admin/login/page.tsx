"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setError(payload?.error || "Unable to sign in."); return; }
      router.replace("/admin");
      router.refresh();
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  }

  return <main className="admin-auth-shell"><div className="admin-auth-card"><p className="admin-eyebrow">The School Expert</p><h1>Admin Dashboard</h1><p>Sign in to view registration submissions.</p><form onSubmit={submit}><label htmlFor="admin-password">Admin password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>{error && <p className="admin-error">{error}</p>}</form></div></main>;
}
