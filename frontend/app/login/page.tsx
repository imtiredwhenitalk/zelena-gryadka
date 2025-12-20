"use client";
import { useState } from "react";
import { api, setToken } from "../../components/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string|null>(null);

  async function submit() {
    setErr(null);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.access_token);
      localStorage.setItem("zg_nickname", data.nickname);
      localStorage.setItem("zg_is_admin", String(data.is_admin));
      location.href = "/";
    } catch (e:any) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-black">Логін</h1>
      <div className="mt-4 space-y-3">
        <input className="w-full rounded-2xl border px-4 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded-2xl border px-4 py-2" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full rounded-2xl bg-emerald-600 text-white px-4 py-2 hover:opacity-90" onClick={submit}>
          Увійти
        </button>
      </div>
    </div>
  );
}
