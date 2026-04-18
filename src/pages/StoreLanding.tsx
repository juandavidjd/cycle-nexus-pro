// src/pages/StoreLanding.tsx
// Página generada dinámicamente en /tienda/:storeCode.
// Composición única — la envolvente (habitat vs srm) la aplica el layout de Capa 1.

import { useParams, Link } from "react-router-dom";
import { useStoreProfile } from "@/context/SkinProvider";
import { StoreHero } from "@/components/store/StoreHero";
import { StoreStats } from "@/components/store/StoreStats";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { FeaturedProducts } from "@/components/store/FeaturedProducts";

export default function StoreLanding() {
  const { storeCode } = useParams<{ storeCode: string }>();
  const { isLoading, error } = useStoreProfile(storeCode);

  if (!storeCode) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Código de tienda faltante</h1>
        <p className="mt-2 text-muted-foreground">
          La ruta debe ser <code>/tienda/&lt;codigo&gt;</code>.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center text-muted-foreground">
        Cargando perfil de {storeCode.toUpperCase()}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          Tienda "{storeCode.toUpperCase()}" no encontrada
        </h1>
        <p className="mt-2 text-muted-foreground">
          Esta tienda no tiene perfil generado en el ecosistema ODI.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm underline hover:no-underline"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHero />
      <StoreStats />
      <CategoryGrid />
      <FeaturedProducts />
    </div>
  );
}
