// src/components/store/StoreHero.tsx
// Hero de tienda: logo (o fallback con iniciales) + nombre + slogan + grade + CTA Shopify.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStoreSkin } from "@/context/SkinProvider";
import { cn } from "@/lib/utils";

function initialsFrom(name: string): string {
  const clean = (name || "").trim();
  if (!clean) return "??";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function gradeVariant(grade: string): "default" | "secondary" | "destructive" | "outline" {
  if (grade === "A+" || grade === "A") return "default";
  if (grade === "B") return "secondary";
  if (grade === "pending") return "outline";
  return "destructive";
}

export function StoreHero() {
  const store = useStoreSkin();
  const [logoFailed, setLogoFailed] = useState(false);

  if (!store) return null;

  const showFallback = !store.logoUrl || logoFailed;
  const initials = initialsFrom(store.storeCode || store.nombre);

  return (
    <section
      className="relative w-full overflow-hidden border-b"
      style={{
        background:
          "linear-gradient(135deg, var(--store-primary, var(--skin-primary)) 0%, var(--store-secondary, var(--skin-surface)) 100%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 md:flex-row md:py-16">
        {/* Logo / fallback */}
        <div
          className={cn(
            "flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-lg ring-1 ring-white/20 md:h-32 md:w-32"
          )}
        >
          {showFallback ? (
            <span className="text-4xl font-bold text-white md:text-5xl">
              {initials}
            </span>
          ) : (
            <img
              src={store.logoUrl}
              alt={`Logo ${store.nombre}`}
              className="h-full w-full object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>

        {/* Título + slogan + CTA */}
        <div className="flex-1 text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-3 md:justify-start">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {store.nombre}
            </h1>
            <Badge variant={gradeVariant(store.grade)} className="text-sm">
              {store.grade}
            </Badge>
          </div>
          {store.slogan && (
            <p className="mb-1 text-lg text-white/80">{store.slogan}</p>
          )}
          {store.ciudad && (
            <p className="mb-4 text-sm text-white/60">{store.ciudad}</p>
          )}
          {store.shopifyUrl && (
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-white/90"
            >
              <a
                href={store.shopifyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver catálogo en tienda
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
