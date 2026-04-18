// src/components/store/FeaturedProducts.tsx
// 6 productos destacados. Fallback visual cuando no hay imagen.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useStoreSkin } from "@/context/SkinProvider";
import type { FeaturedProduct } from "@/types/store-profile";

function formatPrice(n: number): string {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <span className="text-3xl opacity-30">◉</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full bg-muted">
        <ProductImage src={product.image} alt={product.title} />
      </div>
      <CardContent className="p-3">
        <div className="line-clamp-2 text-sm font-medium" title={product.title}>
          {product.title}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{product.sku}</span>
          <span className="font-semibold">{formatPrice(product.price)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturedProducts() {
  const store = useStoreSkin();
  if (!store || store.featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <h2 className="mb-4 text-xl font-semibold">Productos destacados</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {store.featured.map((p) => (
          <ProductCard key={p.sku} product={p} />
        ))}
      </div>
    </section>
  );
}
