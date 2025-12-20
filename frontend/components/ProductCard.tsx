"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  supplier?: string | null;
  price: number;
  image_url?: string | null;
};

export function ProductCard({ p }: { p: Product }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl border bg-white shadow-sm hover:shadow-md overflow-hidden"
    >
      <Link href={`/product/${p.slug}`} className="block">
        <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-zinc-50 flex items-center justify-center">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_BASE}${p.image_url}`} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-emerald-700/70 text-sm">Фото буде тут</div>
          )}
        </div>
        <div className="p-4">
          <div className="font-semibold leading-snug line-clamp-2">{p.name}</div>
          <div className="text-xs text-zinc-500 mt-1">{p.supplier || ""}</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="font-bold">{p.price.toFixed(2)} ₴</div>
            <div className="text-xs text-emerald-700">Детальніше →</div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
