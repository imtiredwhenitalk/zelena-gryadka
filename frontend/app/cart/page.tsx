"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../components/api";
import Link from "next/link";

type CartItem = { product: any; qty: number };

const PAYMENTS = [
  { v: "cod", label: "Післяплата (при отриманні)" },
  { v: "card", label: "Картка (імітація оплати)" },
];

const DELIVERIES = [
  { v: "nova_poshta", label: "Нова Пошта" },
  { v: "ukrposhta", label: "Укрпошта" },
  { v: "courier", label: "Курʼєр" },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [checkout, setCheckout] = useState({
    payment_method: "cod",
    delivery_method: "nova_poshta",
    full_name: "",
    phone: "",
    city: "",
    address: "",
    comment: "",
  });

  async function load() {
    setErr(null);
    try {
      const data = await api("/api/cart");
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "Помилка");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => {
    return items.reduce((s, it) => s + Number(it.product.price || 0) * it.qty, 0);
  }, [items]);

  async function checkoutNow() {
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const r = await api("/api/orders", { method: "POST", body: JSON.stringify(checkout) });
      setOk(`Замовлення створено: #${r.order_id}`);
      setItems([]);
    } catch (e: any) {
      setErr(e?.message || "Помилка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Кошик</div>
        <Link href="/" className="text-emerald-700 hover:underline">← До каталогу</Link>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}
      {ok && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{ok}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border bg-white p-4 shadow-sm flex justify-between gap-4">
              <div>
                <div className="font-medium">{it.product.name}</div>
                <div className="text-sm text-zinc-600">{Number(it.product.price || 0).toFixed(2)} ₴</div>
              </div>
              <div className="text-sm text-zinc-700">× {it.qty}</div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-zinc-600">Кошик порожній.</div>}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="text-lg font-semibold">Оформлення</div>
          <div className="text-sm text-zinc-600">Разом: <span className="font-semibold text-zinc-900">{total.toFixed(2)} ₴</span></div>

          <div className="space-y-2">
            <div className="text-xs text-zinc-500">Оплата</div>
            <select className="w-full rounded-xl border px-3 py-2 text-sm" value={checkout.payment_method}
              onChange={(e) => setCheckout({ ...checkout, payment_method: e.target.value })}>
              {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>

            <div className="text-xs text-zinc-500 mt-2">Доставка</div>
            <select className="w-full rounded-xl border px-3 py-2 text-sm" value={checkout.delivery_method}
              onChange={(e) => setCheckout({ ...checkout, delivery_method: e.target.value })}>
              {DELIVERIES.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
            </select>

            <div className="grid gap-2 mt-2">
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="ПІБ"
                value={checkout.full_name} onChange={(e) => setCheckout({ ...checkout, full_name: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Телефон"
                value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Місто"
                value={checkout.city} onChange={(e) => setCheckout({ ...checkout, city: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Адреса / Відділення"
                value={checkout.address} onChange={(e) => setCheckout({ ...checkout, address: e.target.value })} />
              <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Коментар (необовʼязково)"
                value={checkout.comment} onChange={(e) => setCheckout({ ...checkout, comment: e.target.value })} />
            </div>

            <button
              disabled={busy || items.length === 0}
              onClick={checkoutNow}
              className="mt-2 w-full rounded-xl bg-emerald-700 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Оформляю..." : "Оформити замовлення"}
            </button>

            <div className="text-xs text-zinc-500">
              * “Картка” — це імітація: статус одразу стане <b>paid</b>. Реальну оплату можна підключити пізніше.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
