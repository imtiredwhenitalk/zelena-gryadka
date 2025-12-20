import { ProductsBrowser } from "../../components/ProductsBrowser";

export const metadata = {
  title: "Каталог — Зелена грядка",
  description: "Каталог товарів: насіння, добрива, засоби захисту, інвентар.",
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams.q || "").trim();
  const page = Math.max(1, Number(searchParams.page || "1") || 1);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold">Каталог</h1>
        <p className="text-zinc-600">Фільтри, сортування, пошук — швидко навіть з 800+ товарів.</p>
      </div>
      <ProductsBrowser initialQ={q} initialPage={page} />
    </div>
  );
}
