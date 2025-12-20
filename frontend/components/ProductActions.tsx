"use client";

import { useState } from "react";
import { api } from "./api";

export function ProductActions({ productId }: { productId: number }) {
  const [busy, setBusy] = useState(false);

  async function addToCart() {
    setBusy(true);
    try {
      await api(`/api/cart/${productId}`, { method: "POST" });
      alert("Додано в кошик");
    } catch (e: any) {
      alert(e?.message || "Помилка");
    } finally {
      setBusy(false);
    }
  }

  async function addToFav() {
    setBusy(true);
    try {
      await api(`/api/favorites/${productId}`, { method: "POST" });
      alert("Додано в улюблене");
    } catch (e: any) {
      alert(e?.message || "Помилка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        disabled={busy}
        onClick={addToCart}
        className="rounded-2xl px-5 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60"
      >
        У кошик
      </button>
      <button
        disabled={busy}
        onClick={addToFav}
        className="rounded-2xl px-5 py-3 border font-bold hover:bg-zinc-50 disabled:opacity-60"
      >
        ❤ Улюблене
      </button>
    </div>
  );
}
