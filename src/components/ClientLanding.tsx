import { Client } from "@/types/client";
import { SRMButton } from "./SRMButton";
import { ArrowLeft, Store, Package, FileText, View, Cog } from "lucide-react";

interface ClientLandingProps {
  client: Client;
}

export function ClientLanding({ client }: ClientLandingProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Brand Colors */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${client.palette.accent} 0%, ${client.palette.primary}15 100%)`,
        }}
      >
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 industrial-grid opacity-30" />

        {/* Glow Effect */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: client.palette.primary }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <SRMButton
            to="/catalogo"
            variant="ghost"
            size="sm"
            className="mb-8 text-steel-300 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo SRM
          </SRMButton>

          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Brand Logo */}
            <div
              className="w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-display font-bold text-white shrink-0"
              style={{
                backgroundColor: client.palette.primary,
                boxShadow: `0 0 60px ${client.palette.primary}40`,
              }}
            >
              {client.name.charAt(0)}
            </div>

            {/* Brand Info */}
            <div className="flex-1">
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${client.palette.primary}30`,
                  color: client.palette.primary,
                }}
              >
                {client.type}
              </span>

              <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
                {client.name}
              </h1>

              <p className="text-steel-300 text-lg max-w-2xl mb-8">
                Ficha Técnica SRM + Atributos + Fitment + Conocimiento Unificado.
                Conectado al ecosistema técnico de motocicletas.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <SRMButton
                  href={client.shopify}
                  variant="brand"
                  size="lg"
                  brandColor={client.palette.primary}
                  external
                >
                  <Store className="w-5 h-5" />
                  Tienda Shopify Oficial
                </SRMButton>

                <SRMButton
                  to="/catalogo"
                  variant="outline"
                  size="lg"
                >
                  Ver Más Clientes
                </SRMButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Products Online Placeholder */}
            <PlaceholderCard
              icon={Package}
              title="Productos Online del Cliente"
              description="Catálogo completo de productos disponibles para compra online."
              status="En desarrollo"
              accentColor={client.palette.primary}
            />

            {/* Technical Sheet Placeholder */}
            <PlaceholderCard
              icon={FileText}
              title="Ficha Técnica SRM"
              description="Especificaciones técnicas detalladas, compatibilidad y fitment."
              status="En desarrollo"
              accentColor={client.palette.primary}
            />

            {/* 360 View Placeholder */}
            <PlaceholderCard
              icon={View}
              title="Ficha 360°"
              description="Vista interactiva 360° de productos y componentes."
              status="Próximamente"
              accentColor={client.palette.primary}
            />
          </div>
        </div>
      </section>

      {/* Brand Stats */}
      <section className="py-16 bg-steel-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-foreground mb-4">
              Conectado al Ecosistema SRM
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Integración completa con el pipeline técnico SRM v28 para gestión unificada de catálogo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              value="SRM"
              label="Pipeline Técnico"
              color={client.palette.primary}
            />
            <StatCard
              value="v28"
              label="Versión Actual"
              color={client.palette.primary}
            />
            <StatCard
              value="360°"
              label="Ficha Interactiva"
              color={client.palette.primary}
            />
            <StatCard
              value="API"
              label="Integración"
              color={client.palette.primary}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

interface PlaceholderCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status: string;
  accentColor: string;
}

function PlaceholderCard({ icon: Icon, title, description, status, accentColor }: PlaceholderCardProps) {
  return (
    <div className="card-industrial rounded-xl p-6 hover-lift">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${accentColor}20` }}
      >
        <Icon className="w-6 h-6" style={{ color: accentColor }} />
      </div>

      <h3 className="font-display font-semibold text-lg text-foreground mb-2">
        {title}
      </h3>

      <p className="text-muted-foreground text-sm mb-4">
        {description}
      </p>

      <span
        className="inline-block px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: `${accentColor}15`,
          color: accentColor,
        }}
      >
        {status}
      </span>
    </div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  color: string;
}

function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="text-center p-6 rounded-xl bg-steel-800 border border-border">
      <div
        className="font-display font-bold text-3xl mb-2"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}
