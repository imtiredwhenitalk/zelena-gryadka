import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSeedSlugs, getSeedProduct } from "../../../lib/seed";
import { ProductActions } from "../../../components/ProductActions";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";


function stripHtmlToText(html: string): string {
  // Safe fallback: remove tags. We keep formatting simple to avoid XSS without extra deps.
  return (html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}`, {
      // якщо API доступний у проді — буде підтягувати актуальні дані з кешем
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  // SSG під всі 800+ товарів
  return getAllSeedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const seed = getSeedProduct(params.slug);
  if (!seed) return { title: "Товар не знайдено — Зелена грядка" };
  const title = `${seed.name} — Зелена грядка`;
  const desc = (seed.description || "").slice(0, 160);
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const seed = getSeedProduct(params.slug);
  const apiProd = await fetchProduct(params.slug);

  const p = apiProd || seed;
  if (!p) return notFound();

  const imageUrl =
    (apiProd?.image_url ? `${API_BASE}${apiProd.image_url}` : null) ||
    null;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="text-emerald-700 font-semibold hover:underline">← Назад до каталогу</Link>

      <div className="mt-5 grid md:grid-cols-2 gap-8">
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-zinc-50 relative">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={p.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold">
                Немає фото
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-black">{p.name}</h1>
          <div className="mt-2 text-zinc-600">{p.supplier ? `Постачальник: ${p.supplier}` : ""}</div>

          <div className="mt-4 text-2xl font-extrabold">{Number(p.price || 0).toFixed(2)} ₴</div>

          <div className="mt-4 text-zinc-700 leading-relaxed">
            <div className="prose max-w-none"
              children={stripHtmlToText(p.description || "Опис відсутній")} />
          </div>

          {apiProd?.id ? (
            <div className="mt-6">
              <ProductActions productId={apiProd.id} />
            </div>
          ) : (
            <div className="mt-6 text-sm text-zinc-500">
              (Дії кошика/улюбленого доступні після запуску API)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}