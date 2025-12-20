"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../components/api";

type OrderItem = { name: string; price: number; qty: number };
type Order = {
  id: number;
  status: string;
  payment_method?: string | null;
  delivery_method?: string | null;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  comment?: string | null;
  items: OrderItem[];
};

const STATUSES = ["created", "paid", "processing", "shipped", "delivered", "canceled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await api("/api/admin/orders");
      setOrders(data);
    } catch (e: any) {
      setErr(e?.message || "Помилка");
    }
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: number, status: string) {
    setErr(null);
    try {
      await api(`/api/admin/orders/${id}?status=${encodeURIComponent(status)}`, { method: "PATCH" });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Помилка");
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Адмінка: Замовлення</div>
        <Link href="/admin" className="text-emerald-700 hover:underline">← Назад до товарів</Link>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}

      <div className="space-y-4">
        {orders.map((o) => {
          const total = o.items.reduce((s, it) => s + it.price * it.qty, 0);
          return (
            <div key={o.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-medium">Замовлення #{o.id}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600">Статус:</span>
                  <select
                    className="rounded-xl border px-3 py-2 text-sm"
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                <div><span className="text-zinc-500">Оплата:</span> {o.payment_method || "-"}</div>
                <div><span className="text-zinc-500">Доставка:</span> {o.delivery_method || "-"}</div>
                <div><span className="text-zinc-500">Клієнт:</span> {o.full_name || "-"} ({o.phone || "-"})</div>
                <div><span className="text-zinc-500">Адреса:</span> {o.city || "-"}, {o.address || "-"}</div>
              </div>

              {o.comment && <div className="mt-2 text-sm text-zinc-700"><span className="text-zinc-500">Коментар:</span> {o.comment}</div>}

              <div className="mt-3 rounded-xl border bg-zinc-50 p-3">
                <div className="text-sm font-medium mb-2">Товари</div>
                <ul className="space-y-1 text-sm">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span>{it.name} × {it.qty}</span>
                      <span className="text-zinc-600">{(it.price * it.qty).toFixed(2)} грн</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between text-sm font-semibold">
                  <span>Разом</span>
                  <span>{total.toFixed(2)} грн</span>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <div className="text-sm text-zinc-600">Нема замовлень.</div>}
      </div>
    </div>
  );
}
