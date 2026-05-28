// src/components/store/FeaturedProducts.tsx
// 6 productos destacados V25.24. Fallback visual cuando no hay imagen.
// V2 ND-32 refinement: agrega badge "Verificado ODI" + subtexto contextual +
// CTA bajo grid hacia la tienda Shopify oficial.
// Datos sin cambios — image source ya verificada upstream por V25.24.

import { useState } from "react";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SRMButton } from "@/components/SRMButton";
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
        <span className="text-3xl opacity-30" aria-hidden="true">◉</span>
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
    <Card className="overflow-hidden border-steel-700 bg-steel-900/40">
      <div className="relative aspect-square w-full bg-muted">
        <ProductImage src={product.image} alt={product.title} />
        {/* Badge "Verificado ODI" — capa visual sobre el catálogo V25.24 */}
        <div
          className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-steel-900/85 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/40"
          aria-label="Producto verificado por ODI"
        >
          <BadgeCheck className="h-3 w-3" />
          Verificado ODI
        </div>
      </div>
      <CardContent className="p-3">
        <div
          className="line-clamp-2 text-sm font-medium text-foreground"
          title={product.title}
        >
          {product.title}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {product.sku}
          </span>
          <span className="font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturedProducts() {
  const store = useStoreSkin();
  if (!store || store.featured.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-6xl px-6 py-8"
      aria-labelledby="destacados-heading"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="destacados-heading"
            className="font-display text-xl font-semibold text-foreground"
          >
            Productos destacados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Catálogo certificado · Stock actual · Precios competitivos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {store.featured.map((p) => (
          <ProductCard key={p.sku} product={p} />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <SRMButton
          href={store.shopifyUrl}
          variant="outline"
          size="md"
          external
        >
          <ExternalLink className="h-4 w-4" />
          Ver más productos en la tienda oficial
        </SRMButton>
      </div>
    </section>
  );
}
