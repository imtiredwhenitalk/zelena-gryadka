"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");

  useEffect(() => {
    setQ(sp.get("q") || "");
  }, [sp]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(sp.toString());
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    p.delete("page");
    router.push(`/products?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Пошук товарів..."
        className="flex-1 rounded-2xl border px-4 py-3"
      />
      <button className="rounded-2xl px-5 py-3 bg-zinc-900 text-white font-bold hover:bg-zinc-800">
        Пошук
      </button>
    </form>
  );
}
