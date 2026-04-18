// src/components/store/StoreList.tsx
// Lista de tiendas de una industria. Usado para /industria/:industry.
// Logo con fallback a iniciales + grade badge + conteo productos + link a /tienda/:code.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStoresForIndustry } from "@/context/SkinProvider";
import type { StoreProfileByIndustryRow } from "@/types/store-profile";

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

function StoreLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
        <span className="text-sm font-bold text-muted-foreground">
          {initialsFrom(name)}
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`Logo ${name}`}
      className="h-14 w-14 shrink-0 rounded-lg object-contain bg-muted p-1"
      onError={() => setFailed(true)}
    />
  );
}

function StoreRow({ row }: { row: StoreProfileByIndustryRow }) {
  return (
    <Link to={`/tienda/${row.store.toLowerCase()}`} className="block">
      <Card className="transition-colors hover:border-[var(--skin-primary)]">
        <CardContent className="flex items-center gap-4 p-4">
          <StoreLogo src={row.logo} name={row.nombre} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{row.nombre}</span>
              <Badge variant={gradeVariant(row.grade)} className="text-xs">
                {row.grade}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {row.products.toLocaleString("es-CO")} productos
              {row.categories.length > 0 &&
                ` · ${row.categories.length} categorías`}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface Props {
  industry: string;
}

export function StoreList({ industry }: Props) {
  const { data, isLoading, error } = useStoresForIndustry(industry);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-muted-foreground">
        Cargando tiendas…
      </div>
    );
  }
  if (error || !data || data.stores.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-muted-foreground">
        No hay tiendas disponibles para "{industry}".
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <h2 className="mb-4 text-xl font-semibold">
        Proveedores en {industry} · {data.total}
      </h2>
      <div className="space-y-2">
        {data.stores.map((row) => (
          <StoreRow key={row.store} row={row} />
        ))}
      </div>
    </section>
  );
}
