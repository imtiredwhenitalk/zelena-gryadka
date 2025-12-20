export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE !== undefined ? process.env.NEXT_PUBLIC_API_BASE : "http://localhost:8000");

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("zg_token");
}
export function setToken(t: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("zg_token", t);
}
export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("zg_token");
  localStorage.removeItem("zg_nickname");
  localStorage.removeItem("zg_is_admin");
}

export async function api(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && !(opts.body instanceof FormData)) headers.set("Content-Type","application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(()=> "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
