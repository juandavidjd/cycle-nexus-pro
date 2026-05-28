// src/components/store/CategoryGrid.tsx
// Grid de categorías con conteo + icono semántico (V2 ND-32 refinement only).
// Datos sin cambios — sólo presentación.

import {
  Zap,
  Disc,
  Link as LinkIcon,
  Cog,
  Filter,
  Flame,
  Compass,
  Cable,
  Circle,
  Slash,
  Battery,
  Briefcase,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStoreSkin } from "@/context/SkinProvider";

const CATEGORY_ICON: Record<string, typeof Package> = {
  "Eléctrico": Zap,
  "Retenedores": Circle,
  "Cadenas": LinkIcon,
  "Frenos": Disc,
  "Motor": Cog,
  "Filtros": Filter,
  "Bujías": Flame,
  "Cuna de Dirección": Compass,
  "Cables": Cable,
  "O-Rings": Circle,
  "Llantas": Circle,
  "Correa": Slash,
  "Baterías": Battery,
  "Kits": Briefcase,
};

function pickIcon(name: string) {
  return CATEGORY_ICON[name] ?? Package;
}

export function CategoryGrid() {
  const store = useStoreSkin();
  if (!store || store.categories.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-6xl px-6 py-8"
      aria-labelledby="categorias-heading"
    >
      <h2
        id="categorias-heading"
        className="mb-4 font-display text-xl font-semibold text-foreground"
      >
        Categorías
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {store.categories.map((cat) => {
          const Icon = pickIcon(cat.name);
          return (
            <a
              key={cat.name}
              href={`${store.shopifyUrl}/search?q=${encodeURIComponent(cat.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              aria-label={`Categoría ${cat.name} con ${cat.count.toLocaleString("es-CO")} productos`}
            >
              <Card className="border-steel-700 bg-steel-900/40 transition-colors group-hover:border-[var(--store-primary,var(--skin-primary))]">
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-steel-800"
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4 text-[var(--store-primary,var(--skin-primary))]" />
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {cat.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cat.count.toLocaleString("es-CO")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </section>
  );
}
