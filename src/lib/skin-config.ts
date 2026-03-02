// src/lib/skin-config.ts
// Mapa de dominios → configuracion
// Un solo codebase. El hostname determina QUE SE VE.

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
