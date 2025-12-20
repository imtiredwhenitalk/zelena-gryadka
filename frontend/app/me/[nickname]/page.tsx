"use client";
import { useEffect, useState } from "react";
import { api } from "../../../components/api";
import Link from "next/link";

export default function ProfilePage({ params }: { params: { nickname: string } }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    api(`/api/users/${encodeURIComponent(params.nickname)}/profile`)
      .then(setData)
      .catch((e:any)=>setErr(String(e.message || e)));
  }, [params.nickname]);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!data) return <div className="text-zinc-500">Завантаження…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Профіль: {data.nickname}</h1>
        <p className="text-zinc-600">Тут: улюблені товари та історія замовлень.</p>
      </div>

      <section>
        <h2 className="text-xl font-black">❤️ Улюблене</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data.favorites || []).map((p:any)=>(
            <Link key={p.id} href={`/product/${p.slug}`} className="rounded-2xl border p-4 hover:bg-zinc-50">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-zinc-600">{p.price.toFixed(2)} ₴</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black">🧾 Замовлення</h2>
        <div className="mt-3 space-y-3">
          {(data.orders || []).map((o:any)=>(
            <div key={o.id} className="rounded-2xl border p-4">
              <div className="font-semibold">Замовлення #{o.id} • {o.status}</div>
              <ul className="mt-2 text-sm text-zinc-700 list-disc pl-5">
                {o.items.map((it:any, idx:number)=>(
                  <li key={idx}>{it.name} — {it.qty} шт • {Number(it.price).toFixed(2)} ₴</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
