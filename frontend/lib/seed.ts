import seed from "../data/products_seed_compiled.json";

export type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  supplier?: string | null;
  price: number;
  image?: string | null;
};

export const seedProducts: SeedProduct[] = seed as any;

export function getSeedProduct(slug: string): SeedProduct | undefined {
  return seedProducts.find((p) => p.slug === slug);
}

export function getAllSeedSlugs(): string[] {
  return seedProducts.map((p) => p.slug);
}
