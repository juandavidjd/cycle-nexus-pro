import { Client } from "@/types/client";
import { SRMButton } from "./SRMButton";
import { ArrowLeft, Store } from "lucide-react";
import { useStoreProfile } from "@/context/SkinProvider";
import { StoreStats } from "@/components/store/StoreStats";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { FeaturedProducts } from "@/components/store/FeaturedProducts";

interface ClientLandingProps {
  client: Client;
}

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "#10b981";
  if (grade === "B") return "#f59e0b";
  if (grade === "pending") return "#6b7280";
  return "#ef4444";
}

export function ClientLanding({ client }: ClientLandingProps) {
  // Capa 2: datos vivos del pipeline. Si falla, la landing sigue mostrando el hero.
  const { data: profile, isLoading } = useStoreProfile(client.id);

  const grade = profile?.grade?.final_grade;
  const slogan = profile?.slogan;
  const activeProducts = profile?.stats?.active;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Brand Colors (intacto — Capa 1) */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${client.palette.accent} 0%, ${client.palette.primary}15 100%)`,
        }}
      >
        <div className="absolute inset-0 industrial-grid opacity-30" />
        <div className="absolute inset-0 diagonal-stripes opacity-50" />
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: client.palette.primary }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <SRMButton
            to="/catalogo"
            variant="ghost"
            size="sm"
            className="mb-8 text-steel-300 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catalogo SRM
          </SRMButton>

          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div
              className="w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-display font-extrabold text-white shrink-0"
              style={{
                backgroundColor: client.palette.primary,
                boxShadow: `0 0 60px ${client.palette.primary}40`,
              }}
            >
              {client.name.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-subtitle font-semibold"
                  style={{
                    backgroundColor: `${client.palette.primary}30`,
                    color: client.palette.primary,
                  }}
                >
                  {client.type}
                </span>
                {grade && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: gradeColor(grade) }}
                  >
                    Grado {grade}
                  </span>
                )}
              </div>

              <h1 className="font-display font-extrabold text-4xl md:text-5xl text-foreground mb-4">
                {client.name}
              </h1>

              <p className="font-body text-steel-300 text-lg max-w-2xl mb-8">
                {slogan
                  ? slogan
                  : activeProducts
                    ? `${activeProducts.toLocaleString("es-CO")} productos reales conectados al ecosistema ODI.`
                    : "Conectado al ecosistema tecnico de motocicletas."}
              </p>

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

                <SRMButton to="/catalogo" variant="outline" size="lg">
                  Ver Mas Clientes
                </SRMButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capa 2 (pipeline) — si no hay profile, simplemente no renderiza (degradación elegante) */}
      {profile && (
        <>
          <StoreStats />
          <CategoryGrid />
          <FeaturedProducts />
        </>
      )}

      {isLoading && !profile && (
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Conectando con el ecosistema ODI…
        </div>
      )}
    </div>
  );
}
