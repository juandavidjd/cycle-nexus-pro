// src/components/store/ActoresEcosistemaSRM.tsx
// Sección "¿Quién vive esta experiencia?" — 7 actores del ecosistema SRM.
// Copy literal del orden arquitecto (no inferido del profile).
// Reglas: #ND-32 refinement only · #ND-33 paridad mobile.

import { Building2, Globe2, Truck, Warehouse, Wrench, Bike, Bus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Actor {
  Icon: typeof Building2;
  title: string;
  description: string;
  iconColor: string;
}

const ACTORES: Actor[] = [
  {
    Icon: Building2,
    title: "Fabricantes",
    description: "Abastecimiento confiable y trazable.",
    iconColor: "text-amber-400",
  },
  {
    Icon: Globe2,
    title: "Importadores y exportadores",
    description: "Catálogo certificado para crecer mercados.",
    iconColor: "text-sky-400",
  },
  {
    Icon: Truck,
    title: "Distribuidores mayoristas",
    description: "Disponibilidad real y rotación inteligente.",
    iconColor: "text-orange-400",
  },
  {
    Icon: Warehouse,
    title: "Almacenes",
    description: "Inventario optimizado con datos confiables.",
    iconColor: "text-emerald-400",
  },
  {
    Icon: Wrench,
    title: "Talleres",
    description: "Repuestos correctos, confianza y eficiencia.",
    iconColor: "text-yellow-400",
  },
  {
    Icon: Bike,
    title: "Dueños de moto",
    description: "Seguridad, rendimiento y mejor experiencia.",
    iconColor: "text-rose-400",
  },
  {
    Icon: Bus,
    title: "Empresas con flota",
    description: "Menos paradas, más operación.",
    iconColor: "text-cyan-400",
  },
];

export function ActoresEcosistemaSRM() {
  return (
    <section
      className="mx-auto max-w-6xl px-6 py-12"
      aria-labelledby="actores-heading"
    >
      <div className="mb-6">
        <h2
          id="actores-heading"
          className="font-display text-2xl font-bold text-foreground md:text-3xl"
        >
          ¿Quién vive esta experiencia?
        </h2>
        <p className="mt-2 max-w-3xl font-body text-sm text-muted-foreground md:text-base">
          El ecosistema SRM conecta a todos los actores que mueven la industria
          de las motocicletas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        {ACTORES.map(({ Icon, title, description, iconColor }) => (
          <Card
            key={title}
            className="border-steel-700 bg-steel-900/40 transition-colors hover:border-steel-600"
          >
            <CardContent className="flex flex-col items-start gap-2 p-3">
              <div className="rounded-md bg-steel-800 p-2" aria-hidden="true">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {title}
              </div>
              <div className="text-xs leading-snug text-muted-foreground">
                {description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
