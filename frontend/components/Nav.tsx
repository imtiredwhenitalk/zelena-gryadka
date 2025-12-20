"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clearToken } from "./api";

export function Nav() {
  const [nick, setNick] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setNick(localStorage.getItem("zg_nickname"));
    setIsAdmin(localStorage.getItem("zg_is_admin") === "true");
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-black tracking-tight text-xl">
          <span className="text-emerald-600">Зелена</span> грядка
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/cart" className="hover:underline">Кошик</Link>
          {nick ? (
            <>
              <Link href={`/me/${encodeURIComponent(nick)}`} className="hover:underline">{nick}</Link>
              {isAdmin && <Link href="/admin" className="hover:underline">Адмінка</Link>}
              <button
                className="px-3 py-1 rounded-xl border hover:bg-zinc-50"
                onClick={() => { clearToken(); location.href="/"; }}
              >Вийти</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Логін</Link>
              <Link href="/register" className="px-3 py-1 rounded-xl bg-emerald-600 text-white hover:opacity-90">
                Реєстрація
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
