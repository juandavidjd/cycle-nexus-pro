// src/components/ClientLanding.tsx
// Orchestrator de la landing SRM por proveedor.
// V2 (Browser Tribunal Landing SRM IMBRA Piloto · feat branch):
//   Hero proveedor (ecosistema) · Stats · Actores · Categorías · Destacados · Journey
// Reglas: #ND-32 refinement only · #ND-33 paridad mobile · #46 honestidad absoluta.

import { Client } from "@/types/client";
import { useStoreProfile } from "@/context/SkinProvider";
import { HeroProveedorSRM } from "@/components/store/HeroProveedorSRM";
import { StoreStats } from "@/components/store/StoreStats";
import { ActoresEcosistemaSRM } from "@/components/store/ActoresEcosistemaSRM";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { FeaturedProducts } from "@/components/store/FeaturedProducts";
import { JourneyLandingTienda } from "@/components/store/JourneyLandingTienda";

interface ClientLandingProps {
  client: Client;
}

export function ClientLanding({ client }: ClientLandingProps) {
  // Capa 2: datos vivos del pipeline (Step 10 V25.24).
  // Si falla o aún no carga, hero + actores + journey siguen renderizando
  // (degradación elegante por componente).
  const { data: profile, isLoading } = useStoreProfile(client.id);

  return (
    <div className="min-h-screen">
      {/* Hero proveedor ecosistema-aware */}
      <HeroProveedorSRM client={client} profile={profile} />

      {/* Métricas (sólo si profile cargado) */}
      {profile && <StoreStats />}

      {/* Sección multi-actor — estática, no depende de profile */}
      <ActoresEcosistemaSRM />

      {/* Categorías + Destacados (sólo si profile cargado) */}
      {profile && (
        <>
          <CategoryGrid />
          <FeaturedProducts />
        </>
      )}

      {/* Journey landing → tienda — estática, sólo necesita client */}
      <JourneyLandingTienda client={client} />

      {/* Estado de carga discreto si profile aún no llegó */}
      {isLoading && !profile && (
        <div className="container mx-auto px-4 pb-12 text-center text-sm text-muted-foreground">
          Conectando con el ecosistema ODI…
        </div>
      )}
    </div>
  );
}
