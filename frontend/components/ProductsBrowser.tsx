"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { ProductCard, Product } from "./ProductCard";

const PAGE_SIZE = 24;

type Filters = { categories: string[]; suppliers: string[] };

export function ProductsBrowser({
  initialQ,
  initialPage,
}: {
  initialQ: string;
  initialPage: number;
}) {
  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);

  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc" | "name_asc">("new");

  const [filters, setFilters] = useState<Filters>({ categories: [], suppliers: [] });
  const [items, setItems] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const skip = (page - 1) * PAGE_SIZE;

  useEffect(() => {
    (async () => {
      try {
        const f = await api("/api/products/filters");
        setFilters(f);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr(null);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (category) params.set("category", category);
        if (supplier) params.set("supplier", supplier);
        if (minPrice) params.set("min_price", minPrice);
        if (maxPrice) params.set("max_price", maxPrice);
        if (sort) params.set("sort", sort);
        params.set("skip", String(skip));
        params.set("limit", String(PAGE_SIZE));
        const data = await api(`/api/products?${params.toString()}`);
        setItems(data);
      } catch (e: any) {
        setErr(e?.message || "Помилка завантаження");
        setItems([]);
      } finally {
        setBusy(false);
      }
    })();
  }, [q, category, supplier, minPrice, maxPrice, sort, page, skip]);

  const canPrev = page > 1;
  const canNext = items.length === PAGE_SIZE;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="text-xs text-zinc-500 mb-1">Пошук</div>
            <input className="w-full rounded-xl border px-3 py-2" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Напр. насіння, фунгіцид…" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Категорія</div>
            <select className="w-full rounded-xl border px-3 py-2" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
              <option value="">Всі</option>
              {filters.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Постачальник</div>
            <select className="w-full rounded-xl border px-3 py-2" value={supplier} onChange={(e) => { setPage(1); setSupplier(e.target.value); }}>
              <option value="">Всі</option>
              {filters.suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Ціна</div>
            <div className="flex gap-2">
              <input className="w-full rounded-xl border px-3 py-2" value={minPrice} onChange={(e) => { setPage(1); setMinPrice(e.target.value); }} placeholder="від" />
              <input className="w-full rounded-xl border px-3 py-2" value={maxPrice} onChange={(e) => { setPage(1); setMaxPrice(e.target.value); }} placeholder="до" />
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Сортування</div>
            <select className="w-full rounded-xl border px-3 py-2" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="new">Нові</option>
              <option value="price_asc">Ціна ↑</option>
              <option value="price_desc">Ціна ↓</option>
              <option value="name_asc">Назва A→Z</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50"
            onClick={() => { setQ(""); setCategory(""); setSupplier(""); setMinPrice(""); setMaxPrice(""); setSort("new"); setPage(1); }}
            type="button"
          >
            Скинути
          </button>
          {busy && <div className="text-sm text-zinc-500 py-2">Завантаження…</div>}
        </div>
        {err && <div className="mt-3 text-sm text-red-700">{err}</div>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      <div className="flex items-center justify-between py-2">
        <button disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-zinc-50">
          ← Назад
        </button>
        <div className="text-sm text-zinc-600">Сторінка {page}</div>
        <button disabled={!canNext} onClick={() => setPage((p) => p + 1)} className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-zinc-50">
          Далі →
        </button>
      </div>
    </div>
  );
}
