// src/components/store/JourneyLandingTienda.tsx
// Bloque final de cierre: Landing SRM → Tienda Oficial → Operación y compra.
// Explica que la landing descubre, la tienda convierte.
// Copy literal del orden arquitecto.

import { Search, ChevronRight, ShoppingCart, ExternalLink } from "lucide-react";
import { SRMButton } from "@/components/SRMButton";
import type { Client } from "@/types/client";

interface JourneyLandingTiendaProps {
  client: Client;
}

interface Step {
  Icon: typeof Search;
  title: string;
  subtitle: string;
  body: string;
}

const STEPS: Step[] = [
  {
    Icon: Search,
    title: "Landing SRM",
    subtitle: "Descubre al proveedor",
    body: "Información certificada, catálogo validado y precios confiables.",
  },
  {
    Icon: ChevronRight,
    title: "Tienda Oficial",
    subtitle: "Conoce el detalle",
    body: "Explora productos, stock, compatibilidades y condiciones comerciales.",
  },
  {
    Icon: ShoppingCart,
    title: "Operación y compra",
    subtitle: "Convierte la relación",
    body: "Cotiza, negocia o compra directo en la tienda oficial del proveedor.",
  },
];

export function JourneyLandingTienda({ client }: JourneyLandingTiendaProps) {
  return (
    <section
      className="mx-auto max-w-6xl px-6 py-12"
      aria-labelledby="journey-heading"
    >
      <h2 id="journey-heading" className="sr-only">
        Recorrido del proveedor al ecosistema
      </h2>

      <div className="overflow-hidden rounded-2xl border border-steel-700 bg-gradient-to-r from-steel-900 via-steel-900/80 to-steel-800/50 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
          {STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-steel-600 bg-steel-800"
                  aria-hidden="true"
                >
                  <step.Icon className="h-5 w-5 text-primary" />
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="hidden h-5 w-5 text-steel-500 md:block" aria-hidden="true" />
                )}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {step.title}
              </div>
              <div className="text-base font-bold text-foreground">
                {step.subtitle}
              </div>
              <div className="text-sm text-muted-foreground">
                {step.body}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-steel-700 pt-6">
          <SRMButton
            href={client.shopify}
            variant="brand"
            size="lg"
            brandColor={client.palette.primary}
            external
          >
            <ExternalLink className="h-4 w-4" />
            Ver más productos en la tienda oficial
          </SRMButton>
          <span className="text-xs text-muted-foreground">
            La landing descubre · la tienda convierte
          </span>
        </div>
      </div>
    </section>
  );
}
