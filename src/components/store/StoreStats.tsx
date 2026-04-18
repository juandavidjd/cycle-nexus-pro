// src/components/store/StoreStats.tsx
// Tarjetas: productos, categorías, precio promedio, fitment.

import { Card, CardContent } from "@/components/ui/card";
import { useStoreSkin } from "@/context/SkinProvider";

function formatPrice(n: number): string {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

interface StatProps {
  label: string;
  value: string | number;
  sub?: string;
}

function Stat({ label, value, sub }: StatProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function StoreStats() {
  const store = useStoreSkin();
  if (!store) return null;

  const { stats, fitment, industry } = store;
  const isMotos = industry === "motos";

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-6 py-8 md:grid-cols-4">
      <Stat
        label="Productos activos"
        value={stats.active.toLocaleString("es-CO")}
        sub={
          stats.draft > 0
            ? `${stats.draft.toLocaleString("es-CO")} en borrador`
            : undefined
        }
      />
      <Stat
        label="Categorías"
        value={stats.categories_count || store.categories.length}
      />
      <Stat label="Precio promedio" value={formatPrice(stats.avg_price)} />
      {isMotos ? (
        <Stat
          label="Compatibilidad"
          value={fitment.skus.toLocaleString("es-CO")}
          sub={`${fitment.brands} marca${fitment.brands === 1 ? "" : "s"}`}
        />
      ) : (
        <Stat label="Precio máximo" value={formatPrice(stats.max_price)} />
      )}
    </section>
  );
}
