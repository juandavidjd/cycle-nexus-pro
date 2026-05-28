// src/components/FooterEcosistemaSRM.tsx
// Footer ecosistema-aware 5 columnas: Navegación · Catálogo · Actores ·
// Ayuda · Contacto. Reemplaza FooterSRM solo en ClientPage.
// Reglas: #ND-32 refinement only · #ND-33 paridad mobile (stack vertical) ·
// #46 no inventar teléfono ni contacto que no exista; usar fallback neutro.

import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { SRMLogo } from "@/components/SRMLogo";
import { cn } from "@/lib/utils";

interface FooterEcosistemaSRMProps {
  className?: string;
}

interface ColumnLink {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
}

const NAVEGACION: ColumnLink[] = [
  { label: "Inicio", to: "/" },
  { label: "Catálogo SRM", to: "/catalogo" },
  { label: "Clientes", to: "/clientes" },
  { label: "SRM Intelligent", to: "/intelligent" },
  { label: "Academia", to: "/academia" },
];

const CATALOGO: ColumnLink[] = [
  { label: "Proveedores", to: "/clientes" },
  { label: "Categorías", to: "/catalogo" },
  { label: "Productos", to: "/catalogo" },
  { label: "Marcas", to: "/catalogo" },
];

const ACTORES: string[] = [
  "Fabricantes",
  "Importadores y exportadores",
  "Distribuidores mayoristas",
  "Almacenes",
  "Talleres",
  "Dueños de moto",
  "Empresas con flota",
];

const AYUDA: ColumnLink[] = [
  { label: "Términos y condiciones", to: "/terms" },
  { label: "Políticas de privacidad", to: "/privacy" },
];

function ColLinks({ items }: { items: ColumnLink[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => (
        <li key={it.label}>
          {it.to ? (
            <Link
              to={it.to}
              className="font-body text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {it.label}
            </Link>
          ) : (
            <a
              href={it.href}
              {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="font-body text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {it.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function FooterEcosistemaSRM({ className }: FooterEcosistemaSRMProps) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-steel-700 bg-steel-900",
        className
      )}
      aria-label="Pie de página del ecosistema SRM"
    >
      <div className="container mx-auto px-6 py-10 md:px-4 md:py-12">
        {/* Grid 5 columnas en desktop, stack en mobile */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand + descripción */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-3 inline-flex items-center gap-2">
              <SRMLogo className="h-8 w-8" />
              <span className="font-display text-lg font-bold text-foreground">
                SRM
              </span>
            </Link>
            <p className="max-w-xs font-body text-sm leading-relaxed text-muted-foreground">
              El ecosistema que conecta, certifica y potencia a toda la industria
              de las motocicletas en Latinoamérica.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
              Navegación
            </h3>
            <ColLinks items={NAVEGACION} />
          </div>

          {/* Catálogo */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
              Catálogo
            </h3>
            <ColLinks items={CATALOGO} />
          </div>

          {/* Actores / Ecosistema */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
              Actores / Ecosistema
            </h3>
            <ul className="flex flex-col gap-2">
              {ACTORES.map((a) => (
                <li
                  key={a}
                  className="font-body text-sm text-muted-foreground"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda + Contacto */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
              Ayuda
            </h3>
            <ColLinks items={AYUDA} />

            <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-foreground">
              Contacto
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="mailto:info@somosrepuestosmotos.com"
                className="flex items-center gap-2 font-body text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="break-all">info@somosrepuestosmotos.com</span>
              </a>
              <div className="flex items-center gap-2 font-body text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>Colombia · Latinoamérica</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-steel-700 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 SRM — Somos Repuestos Motos. Todos los derechos reservados.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Un proyecto del ecosistema{" "}
            <a
              href="https://ecosistema-adsi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline hover:text-foreground"
            >
              ADSI-ODI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
