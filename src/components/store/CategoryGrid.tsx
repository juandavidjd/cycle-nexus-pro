// src/components/store/CategoryGrid.tsx
// Grid de categorías con conteo. Link a Shopify collection por nombre.

import { Card, CardContent } from "@/components/ui/card";
import { useStoreSkin } from "@/context/SkinProvider";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryGrid() {
  const store = useStoreSkin();
  if (!store || store.categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <h2 className="mb-4 text-xl font-semibold">Categorías</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {store.categories.map((cat) => (
          <a
            key={cat.name}
            href={`${store.shopifyUrl}/collections/${slugify(cat.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="transition-colors group-hover:border-[var(--store-primary,var(--skin-primary))]">
              <CardContent className="flex items-center justify-between p-3">
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {cat.count.toLocaleString("es-CO")}
                </span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
