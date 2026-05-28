// src/components/store/StoreStats.tsx
// Tarjetas: productos, categorías, precio promedio, fitment.
// V2: iconos + subtexto contextual ecosistema-aware (ND-32 refinement only).
// Fuente de datos sin cambios (useStoreSkin) — sólo presentación.

import { Package, LayoutGrid, DollarSign, ShieldCheck } from "lucide-react";
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
  Icon: typeof Package;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
}

function Stat({ Icon, label, value, sub, iconColor = "text-primary" }: StatProps) {
  return (
    <Card className="border-steel-700 bg-steel-900/40">
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-steel-800"
          aria-hidden="true"
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-xl font-bold text-foreground md:text-2xl">
            {value}
          </div>
          {sub && (
            <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StoreStats() {
  const store = useStoreSkin();
  if (!store) return null;

  const { stats, fitment, industry } = store;
  const isMotos = industry === "motos";
  // Si stats.categories_count está inconsistente con categories.length,
  // preferir categories.length (más confiable post-V25.24).
  const categoriesCount =
    stats.categories_count > 0
      ? stats.categories_count
      : store.categories.length;

  return (
    <section
      className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-6 py-8 md:grid-cols-4"
      aria-label="Métricas del proveedor"
    >
      <Stat
        Icon={Package}
        label="Productos activos"
        value={stats.active.toLocaleString("es-CO")}
        sub={
          stats.draft > 0
            ? `${stats.draft.toLocaleString("es-CO")} en borrador`
            : "Productos verificados"
        }
        iconColor="text-emerald-400"
      />
      <Stat
        Icon={LayoutGrid}
        label="Categorías"
        value={categoriesCount}
        sub="Líneas de producto"
        iconColor="text-orange-400"
      />
      <Stat
        Icon={DollarSign}
        label="Precio promedio"
        value={formatPrice(stats.avg_price)}
        sub="Precios competitivos"
        iconColor="text-green-400"
      />
      {isMotos ? (
        <Stat
          Icon={ShieldCheck}
          label="Compatibilidad"
          value={fitment.brands.toLocaleString("es-CO")}
          sub={`${fitment.brands === 1 ? "Marca compatible" : "Marcas compatibles"}`}
          iconColor="text-sky-400"
        />
      ) : (
        <Stat
          Icon={DollarSign}
          label="Precio máximo"
          value={formatPrice(stats.max_price)}
          sub="Producto premium"
          iconColor="text-amber-400"
        />
      )}
    </section>
  );
}
