// src/lib/skin-config.ts
// ═══════════════════════════════════════════════════
// SKIN ENGINE — DOS CAPAS
// Capa 1 (Dominio, HARDCODED): hostname → layout + voz. Fallback si API falla.
// Capa 2 (Tienda, DINÁMICO): /tienda/:code → colores + datos. Se apila ENCIMA de Capa 1.
// Capa 2 nunca overridea layout/voice de Capa 1.
// ═══════════════════════════════════════════════════

import {
  fetchStoreProfiles,
  fetchStoreProfile,
} from "./odiApi";
import type {
  StoreProfile,
  StoreCategory,
  FeaturedProduct,
  StoreStats,
  StoreColors,
} from "@/types/store-profile";

export type SkinId = "odi" | "srm" | "adsi" | "catrmu";
export type SkinLayer = "catrmu" | "adsi" | "odi" | "industry";

export interface SkinConfig {
  id: SkinId;
  layer: SkinLayer;
  label: string;
  layout: "habitat" | "srm" | "adsi" | "catrmu";
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
  };
  voice: "ramona" | "tony";
  greeting: string;
  domain: string;
}

export const SKINS: Record<string, SkinConfig> = {
  // ─── Habitat ODI (default) ───
  "liveodi.com": {
    id: "odi",
    layer: "odi",
    label: "ODI",
    layout: "habitat",
    colors: {
      primary: "#3db8ff",
      accent: "#2ef08a",
      background: "#020509",
      surface: "#0b1625",
    },
    voice: "ramona",
    greeting: "Hola. Estoy aquí.",
    domain: "liveodi.com",
  },

  // ─── SRM Motos ───
  "somosrepuestosmotos.com": {
    id: "srm",
    layer: "industry",
    label: "SRM",
    layout: "srm",
    colors: {
      primary: "#ef4444",
      accent: "#49c2ff",
      background: "#0f0f14",
      surface: "#1a1a24",
    },
    voice: "tony",
    greeting: "Bienvenido al ecosistema SRM.",
    domain: "somosrepuestosmotos.com",
  },

  // ─── ADSI (futuro) ───
  "ecosistema-adsi.com": {
    id: "adsi",
    layer: "adsi",
    label: "ADSI",
    layout: "adsi",
    colors: {
      primary: "#c4a0ff",
      accent: "#3db8ff",
      background: "#020509",
      surface: "#0b1625",
    },
    voice: "ramona",
    greeting: "Plataforma ADSI.",
    domain: "ecosistema-adsi.com",
  },

  // ─── CATRMU (futuro) ───
  "catrmu.com": {
    id: "catrmu",
    layer: "catrmu",
    label: "CATRMU",
    layout: "catrmu",
    colors: {
      primary: "#ff9f43",
      accent: "#2ef08a",
      background: "#020509",
      surface: "#0b1625",
    },
    voice: "ramona",
    greeting: "Canal Transversal.",
    domain: "catrmu.com",
  },
};

// ─── Default: ODI ───
export const DEFAULT_SKIN = SKINS["liveodi.com"];

// ═══════════════════════════════════════════════════
// CAPA 2 — STORE SKIN (datos + colores por tienda)
// ═══════════════════════════════════════════════════

export interface StoreSkin {
  storeCode: string;        // "BARA"
  nombre: string;
  slogan: string;
  industry: string;
  industry_sub: string;
  ciudad: string;
  colors: StoreColors;      // primary / secondary / accent
  logoUrl: string;
  faviconUrl: string;
  shopifyUrl: string;
  greeting: string;
  grade: string;            // A+ / A / B / C / pending
  stats: StoreStats;
  categories: StoreCategory[];
  featured: FeaturedProduct[];
  fitment: { skus: number; brands: number };
  ogImage: string;
}

/** Reduce un StoreProfile completo al shape de Capa 2. */
export function profileToSkin(p: StoreProfile): StoreSkin {
  return {
    storeCode: p.store_code,
    nombre: p.nombre,
    slogan: p.slogan || "",
    industry: p.industry,
    industry_sub: p.industry_sub,
    ciudad: p.ciudad || "",
    colors: p.colores,
    logoUrl: p.logo_url,
    faviconUrl: p.favicon_url,
    shopifyUrl: p.shopify.url,
    greeting: p.skin?.greeting || `Bienvenido a ${p.nombre}`,
    grade: p.grade?.final_grade || "pending",
    stats: p.stats,
    categories: p.categories || [],
    featured: p.featured_products || [],
    fitment: p.fitment_summary || { skus: 0, brands: 0 },
    ogImage: p.meta?.og_image || "",
  };
}

/** Trae las 16 tiendas y carga sus perfiles completos en paralelo.
 *  Resultado: `{BARA: StoreSkin, VITTON: StoreSkin, ...}` (claves UPPER). */
export async function buildSkinMap(): Promise<Record<string, StoreSkin>> {
  const list = await fetchStoreProfiles();
  const entries = await Promise.all(
    list.profiles.map(async (row) => {
      try {
        const profile = await fetchStoreProfile(row.store);
        return [row.store.toUpperCase(), profileToSkin(profile)] as const;
      } catch {
        return null;
      }
    })
  );
  const map: Record<string, StoreSkin> = {};
  for (const e of entries) {
    if (e) map[e[0]] = e[1];
  }
  return map;
}

/** CSS fallback para cuando el perfil está cargando o falló. */
export const PLACEHOLDER_STORE_COLORS: StoreColors = {
  primary: "#3db8ff",
  secondary: "#2D3748",
  accent: "#2ef08a",
};
