// src/components/store/HeroProveedorSRM.tsx
// Hero ecosistema-aware para landing SRM de proveedor.
// Reemplaza el hero antiguo de ClientLanding con identidad real + grade honesto
// + narrativa multi-actor + panel diagrama ecosistema.
// Reglas: #ND-32 refinement only · #ND-33 paridad mobile portrait+landscape
// · #46 honestidad absoluta (no declarar A/A+ si grade pending).
//
// Consumido por: ClientLanding.tsx
// Datos: client (clients.json) + profile (StoreProfile vía useStoreProfile).

import { useState } from "react";
import { Store, Users, BadgeCheck, Building2, Truck, Warehouse, Wrench, Bike, Globe2, ShieldCheck } from "lucide-react";
import { SRMButton } from "@/components/SRMButton";
import type { Client } from "@/types/client";
import type { StoreProfile } from "@/types/store-profile";

interface HeroProveedorSRMProps {
  client: Client;
  profile?: StoreProfile;
}

/** Devuelve label honesto según grade real del profile. */
function gradeLabel(grade?: string): { text: string; tone: "certified" | "pending" } {
  if (grade === "A+" || grade === "A" || grade === "B") {
    return { text: `Grado ${grade} · Certificado ODI`, tone: "certified" };
  }
  return { text: "Certificación en validación ODI", tone: "pending" };
}

function LogoBox({ src, alt, fallbackChar, palette }: {
  src?: string;
  alt: string;
  fallbackChar: string;
  palette: { primary: string; accent: string };
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white md:h-24 md:w-24"
        style={{
          background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
          boxShadow: `0 0 30px ${palette.primary}40`,
        }}
        aria-hidden="true"
      >
        {fallbackChar}
      </div>
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 md:h-24 md:w-24">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        loading="eager"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** Panel diagrama ecosistema — IMBRA centro, 8 actores alrededor. */
function EcosistemaDiagram({ centerName, palette }: {
  centerName: string;
  palette: { primary: string; accent: string };
}) {
  // 8 actores en posiciones radiales (octágono) sin imágenes externas.
  const nodes = [
    { Icon: Building2, label: "Fabricantes", angle: 0 },
    { Icon: Globe2, label: "Importadores", angle: 45 },
    { Icon: Truck, label: "Distribuidores", angle: 90 },
    { Icon: Warehouse, label: "Almacenes", angle: 135 },
    { Icon: Wrench, label: "Talleres", angle: 180 },
    { Icon: Bike, label: "Dueños de moto", angle: 225 },
    { Icon: Store, label: "Empresas con flota", angle: 270 },
    { Icon: ShieldCheck, label: "Certificación ODI", angle: 315 },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl border border-steel-700 bg-steel-900/60 p-6">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Centro */}
        <div
          className="z-10 flex h-20 w-20 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
            boxShadow: `0 0 25px ${palette.primary}60`,
          }}
          aria-label={`Centro del ecosistema: ${centerName}`}
        >
          {centerName.toUpperCase()}
        </div>
        {/* Líneas conectoras + nodos */}
        {nodes.map(({ Icon, label, angle }) => {
          const radius = 38; // % desde centro
          const rad = (angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          return (
            <div
              key={label}
              className="absolute flex h-9 w-9 items-center justify-center rounded-full border border-steel-700 bg-steel-800 text-steel-300"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              title={label}
              aria-label={label}
            >
              <Icon className="h-4 w-4" />
            </div>
          );
        })}
        {/* SVG líneas — z bajo */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          {nodes.map(({ angle }, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 38 * Math.cos(rad);
            const y = 50 + 38 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={50} y1={50} x2={x} y2={y}
                stroke={palette.primary}
                strokeOpacity="0.25"
                strokeWidth="0.4"
                strokeDasharray="1.5,1.2"
              />
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-3 left-0 right-0 px-4 text-center">
        <div className="text-sm font-semibold text-foreground">
          Proveedor descubierto por todo el sector
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Catálogo certificado por ODI para todo el ecosistema.
        </div>
      </div>
    </div>
  );
}

export function HeroProveedorSRM({ client, profile }: HeroProveedorSRMProps) {
  const grade = gradeLabel(profile?.grade?.final_grade);
  const logoUrl = profile?.logo_url;
  const palette = {
    primary: client.palette.primary,
    accent: client.palette.accent,
  };

  return (
    <section
      className="relative overflow-hidden pt-28 pb-12 md:pt-32 md:pb-16"
      style={{
        background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.primary}15 100%)`,
        minHeight: "auto",
      }}
      aria-label={`Hero proveedor ${client.name}`}
    >
      <div className="absolute inset-0 industrial-grid opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 diagonal-stripes opacity-50" aria-hidden="true" />
      <div
        className="absolute top-0 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: palette.primary }}
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto px-4">
        <SRMButton
          to="/catalogo"
          variant="ghost"
          size="sm"
          className="mb-6 text-steel-300 hover:text-foreground"
        >
          ← Volver al Catálogo SRM
        </SRMButton>

        {/* Grid 2 columnas: identidad / diagrama */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          {/* Columna identidad */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <LogoBox
                src={logoUrl}
                alt={`Logo ${client.name}`}
                fallbackChar={client.name.charAt(0)}
                palette={palette}
              />
              <div className="flex flex-1 flex-col gap-3">
                {/* Badges tipo + grade honesto */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${palette.primary}30`,
                      color: palette.primary,
                    }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {client.type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      grade.tone === "certified"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                        : "bg-steel-700/40 text-steel-300 border border-steel-600"
                    }`}
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {grade.text}
                  </span>
                </div>

                <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
                  {client.name}
                </h1>
              </div>
            </div>

            {/* Copy multi-actor — literal, no inferido del profile */}
            <p className="max-w-2xl font-body text-base text-steel-300 md:text-lg">
              Proveedor visible para todo el ecosistema. Conecta a fabricantes,
              importadores, distribuidores, almacenes, talleres, empresas con
              flota y dueños de moto con un catálogo confiable y competitivo.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <SRMButton
                href={client.shopify}
                variant="brand"
                size="lg"
                brandColor={palette.primary}
                external
              >
                <Store className="h-5 w-5" />
                Tienda Shopify Oficial
              </SRMButton>
              <SRMButton to="/clientes" variant="outline" size="lg">
                <Users className="h-5 w-5" />
                Ver más clientes
              </SRMButton>
            </div>
          </div>

          {/* Columna diagrama ecosistema */}
          <div className="w-full">
            <EcosistemaDiagram centerName={client.name} palette={palette} />
          </div>
        </div>
      </div>
    </section>
  );
}
