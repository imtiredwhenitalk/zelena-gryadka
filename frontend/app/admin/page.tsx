"use client";

import { useEffect, useMemo, useState } from "react";
import { api, API_BASE } from "../../components/api";
import { RichTextEditor } from "../../components/RichTextEditor";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  supplier?: string | null;
  category?: string | null;
  price: number;
  image_url?: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

export default function AdminPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    id: 0,
    name: "",
    slug: "",
    price: "0",
    description: "",
    supplier: "",
    category: "",
  });

  const isAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("zg_is_admin") === "true";
  }, []);

  async function load() {
    const data = await api(`/api/products?q=${encodeURIComponent(q)}&limit=200`);
    setItems(data);
  }

  useEffect(() => {
    if (!isAdmin) {
      location.href = "/login";
      return;
    }
    load().catch((e: any) => setErr(String(e?.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setErr(null);
    try {
      await load();
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  function startCreate() {
    setForm({ id: 0, name: "", slug: "", price: "0", description: "", supplier: "" });
  }

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price ?? 0),
      description: p.description || "",
      supplier: p.supplier || "",
        category: (p as any).category || "",
    });
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
        price: Number(form.price),
        description: form.description || "",
        supplier: form.supplier ? form.supplier : null,
      };

      if (!payload.name) throw new Error("Назва обов'язкова");
      if (!payload.slug) throw new Error("Slug обов'язковий");

      if (form.id) {
        await api(`/api/admin/products/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
        alert("Оновлено ✅");
      } else {
        await api(`/api/admin/products`, { method: "POST", body: JSON.stringify(payload) });
        alert("Створено ✅");
      }
      await refresh();
      startCreate();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function del(id: number) {
    if (!confirm("Видалити товар?")) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/admin/products/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(id: number, file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api(`/api/admin/products/${id}/image`, { method: "POST", body: fd });
      await refresh();
      alert("Фото завантажено ✅");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Адмінка</h1>
          <div className="text-zinc-600 mt-1">Додати / редагувати / видалити товари + фото</div>
        </div>

        <div className="flex gap-2 w-full md:w-[520px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук у товарах…"
            className="flex-1 rounded-2xl border px-4 py-3"
          />
          <button
            onClick={() => refresh()}
            className="rounded-2xl px-5 py-3 bg-zinc-900 text-white font-bold hover:bg-zinc-800"
          >
            Знайти
          </button>
        </div>
      </div>

      {err && <div className="mt-4 p-3 rounded-2xl border border-red-200 bg-red-50 text-red-800">{err}</div>}

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border bg-white shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">{form.id ? "Редагування" : "Новий товар"}</div>
            {form.id ? (
              <button onClick={startCreate} className="text-sm font-bold text-emerald-700 hover:underline">
                + Створити новий
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })}
              placeholder="Назва"
              className="w-full rounded-2xl border px-4 py-3"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Slug (url)"
              className="w-full rounded-2xl border px-4 py-3"
            />
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ціна"
              className="w-full rounded-2xl border px-4 py-3"
            />
            <input
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="Постачальник (опціонально)"
              className="w-full rounded-2xl border px-4 py-3"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Опис"
              className="w-full rounded-2xl border px-4 py-3 min-h-[140px]"
            />
            <button
              disabled={busy}
              onClick={save}
              className="w-full rounded-2xl px-5 py-3 bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-60"
            >
              {form.id ? "Зберегти" : "Додати"}
            </button>

            {form.id ? (
              <div className="rounded-2xl border p-4">
                <div className="font-bold">Фото товару</div>
                <div className="text-xs text-zinc-500 mt-1">jpg / png / webp</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(form.id, file);
                  }}
                />
              </div>
            ) : (
              <div className="text-xs text-zinc-500">
                * Спочатку створіть товар, потім завантажте фото.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="font-extrabold">Товари ({items.length})</div>
            <div className="text-xs text-zinc-500">API: {API_BASE}</div>
          </div>

          <div className="max-h-[620px] overflow-auto">
            {items.map((p) => (
              <div key={p.id} className="p-4 border-b flex gap-3 items-start">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 overflow-hidden flex items-center justify-center">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${API_BASE}${p.image_url}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[10px] text-emerald-700/70 font-bold">NO IMG</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold leading-snug">{p.name}</div>
                  <div className="text-xs text-zinc-500">{p.slug}</div>
                  <div className="text-sm mt-1 font-extrabold">{Number(p.price || 0).toFixed(2)} ₴</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    disabled={busy}
                    onClick={() => startEdit(p)}
                    className="rounded-2xl px-3 py-2 border font-bold hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Редагувати
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => del(p.id)}
                    className="rounded-2xl px-3 py-2 border border-red-200 text-red-700 font-bold hover:bg-red-50 disabled:opacity-60"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Нічого не знайдено</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
