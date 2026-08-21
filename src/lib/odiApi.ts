// src/lib/odiApi.ts
// ═══════════════════════════════════════════════════
// CAPA UNICA DE COMUNICACION CON ODI
// TODO el frontend pasa por aqui. SRM y ODI.
// Si necesitas otro endpoint, AGREGALO AQUI.
// NUNCA crees un segundo archivo de API.
// ═══════════════════════════════════════════════════

// Detectar env var (Vite)
const ODI_API: string =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_ODI_API) ||
  "https://api.liveodi.com";

export { ODI_API };

// ─── Tipos Chat ───

export interface ODIProduct {
  sku: string;
  title: string;
  price: string;          // Viene como "2000.00" — SIEMPRE parseFloat()
  image: string | null;   // null en ~81% de productos
  url: string;            // Link a tienda Shopify
  store: string;          // ID corto: DFG, IMBRA, KAIQI...
  vendor: string;         // Nombre completo del vendor
  from: string;           // Empresa proveedora → mostrar en card
}

export interface ODIChatResponse {
  // Texto
  response: string;
  narrative?: string;
  follow?: string | null;

  // Productos
  productos: ODIProduct[];
  productos_encontrados: number;

  // Skin Engine
  mode?: string;                        // commerce|care|build|diagnose|empower|optimize|learn
  voice?: "ramona" | "tony" | string;
  industry?: string;                    // motos|salud_dental|...
  from?: string | null;
  guardian_color?: string;              // verde|naranja|rojo
  audio_enabled?: boolean;

  // Session
  session_id?: string;
  nivel_intimidad?: number;
  modo?: string;                        // SUPERVISADO|AUTONOMO

  // Futuro (hoy null)
  company_identity?: any;
}

// ─── Chat ───

/**
 * Detecta el store actual desde la URL del browser.
 * FASE 2.2 GO 2A (Deuda #34, 30 abr 2026): cuando el habitante navega
 * /<store-code> o landing de empresa, el frontend transporta ese contexto
 * al backend para que ChromaDB filtre por store y NO haga cross-store search.
 *
 * Stores conocidos en el ecosistema (subset GOVERNED_STORES gateway):
 *   DUNA, BARA, YOKOMAR, KAIQI, DFG, JAPAN, LEO, VAISAND, IMBRA, MCLMOTOS,
 *   ARMOTOS, VITTON, STORE
 *
 * Returns: store-code uppercase si la URL coincide, null si no hay contexto.
 */
export function detectStoreContext(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname.toLowerCase();
  // Patterns: /duna, /duna/foo, /landing/duna, /tienda/duna
  const m = path.match(/\/(?:landing\/|tienda\/|store\/)?([a-z0-9_-]+)(?:\/|$)/);
  if (!m) return null;
  const candidate = m[1].toUpperCase();
  const KNOWN = new Set([
    "DUNA", "BARA", "YOKOMAR", "KAIQI", "DFG", "JAPAN", "LEO", "VAISAND",
    "IMBRA", "MCLMOTOS", "ARMOTOS", "VITTON", "STORE",
  ]);
  return KNOWN.has(candidate) ? candidate : null;
}

export async function odiChat(
  message: string,
  sessionId?: string,
  defaultStore?: string | null,
): Promise<ODIChatResponse> {
  // Auto-detección: si el caller no pasó defaultStore explícito, intentar
  // resolver desde la URL actual (Deuda #34 fix).
  const effectiveStore =
    defaultStore !== undefined ? defaultStore : detectStoreContext();

  const body: Record<string, unknown> = { message, session_id: sessionId };
  if (effectiveStore) {
    body.default_store = effectiveStore;
  }

  const res = await fetch(`${ODI_API}/odi/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ODI ${res.status}: ${txt}`.trim());
  }

  return (await res.json()) as ODIChatResponse;
}

// ─── Health ───

export async function odiHealth() {
  try {
    const res = await fetch(`${ODI_API}/odi/chat/health`);
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

// ─── Placeholder para imagenes null ───

export const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
  '<rect fill="#0b1625" width="400" height="300" rx="8"/>' +
  '<text fill="#4a6585" font-family="system-ui" font-size="13" text-anchor="middle" x="200" y="142">Sin imagen disponible</text>' +
  '<text fill="#2d4058" font-family="system-ui" font-size="11" text-anchor="middle" x="200" y="164">Producto verificado</text>' +
  '</svg>'
);

// ─── Helpers ───

export function formatPriceCOP(priceStr: string): string {
  const n = parseFloat(priceStr || "0");
  return isFinite(n) ? `$${n.toLocaleString("es-CO")}` : priceStr;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const KEY = "odi_session_id";
  const saved = localStorage.getItem(KEY);
  if (saved) return saved;
  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}

// ═══════════════════════════════════════════════════
// LEGACY V1 ENDPOINTS
// Usados por componentes SRM existentes (Processor, ClientLanding, etc.)
// Endpoint base: /odi/v1
// ═══════════════════════════════════════════════════

const ODI_V1_API = `${ODI_API}/odi/v1`;

// ─── Tipos Legacy ───

export interface ODIProductLegacy {
  sku: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  precio_cop: number;
  compatible_models?: string;
  tipo?: string;
}

export interface ODISearchResult {
  total: number;
  products: ODIProductLegacy[];
  query: string;
}

export interface ODIStore {
  store_id: string;
  product_count: number;
}

export interface ODIEcosystem {
  total_stores: number;
  total_products: number;
  stores: ODIStore[];
}

export interface ODIStoreSummary {
  store_id: string;
  stats: {
    total_products: number;
    categories: number;
  };
  top_categories: { name: string; count: number }[];
  recent_products: ODIProductLegacy[];
}

export interface ODIProduct360 {
  technicalName: string;
  originalName?: string;
  category?: string;
  subcategory?: string;
  srmCode?: string;
  proveedor?: string;
  precio_cop?: number;
  compatible_models?: string;
  attributes?: {
    material?: string;
    mechanicalFunction?: string;
    weight?: string;
    dimensions?: string;
  };
  fitment?: {
    brands: string[];
    models: string[];
    years: string[];
  };
  images?: string[];
  technicalDescription?: string;
  commercialDescription?: string;
  aliases?: string[];
}

export interface ODIFitmentResult {
  compatible_products: number;
  results: ODIProductLegacy[];
  query: string;
}

// ─── Fetch helper legacy ───

async function apiFetchV1<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ODI_V1_API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`ODI API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Legacy API object (default export for backward compat) ───

const odiApi = {
  health: () => apiFetchV1<{ status: string; services: Record<string, string> }>("/health"),

  searchProducts: (q: string, limit = 10) =>
    apiFetchV1<ODISearchResult>(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getEcosystem: () => apiFetchV1<ODIEcosystem>("/ecosystem/stores"),

  getStoreSummary: (storeId: string) =>
    apiFetchV1<ODIStoreSummary>(`/stores/${encodeURIComponent(storeId)}/summary`),

  getProduct360: (sku: string) =>
    apiFetchV1<ODIProduct360>(`/products/${encodeURIComponent(sku)}/360`),

  searchFitment: (q: string) =>
    apiFetchV1<ODIFitmentResult>(`/fitment/search?q=${encodeURIComponent(q)}`),

  chat: (message: string, sessionId?: string) =>
    odiChat(message, sessionId),
};

export default odiApi;

// ══════════════════════════════════════════════════════════
// ODI MANAGER — API Functions
// Consume api.liveodi.com/manager/*
// ══════════════════════════════════════════════════════════

const MANAGER_BASE = `${ODI_API}/manager`;

export interface ManagerStore {
  store_id: string;
  display_name: string;
  shop: string;
  industry: string;
  active: number;
  draft: number;
  total: number;
  grade: string;
  status: string;
  source_type: string;
  has_token: boolean;
}

export interface ManagerService {
  name: string;
  label: string;
  port: number;
  status: string;
  code: number;
}

export interface ManagerDashboard {
  organism: string;
  version: string;
  generated_at: string;
  stores_total: number;
  products_active: number;
  products_total: number;
  stores: ManagerStore[];
  services: Record<string, ManagerService>;
  flows_total: number;
  flows_readiness: Record<string, number>;
  organisms_total: number;
  organisms_readiness: Record<string, number>;
}

export interface ManagerFlowCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  flows_count: number;
}

export interface ManagerFlow {
  flow_id: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  return_visit: boolean;
  steps_count: number;
  return_steps_count: number;
  backend_services: string[];
  organism: string;
  readiness: string;
}

export interface ManagerFlowStep {
  phase?: string;
  role?: string;
  voice?: string;
  text?: string;
  mode?: string;
  detail?: string;
  follow?: string;
  system_action?: Record<string, unknown>;
  products: Record<string, unknown>[];
}

export interface ManagerFlowDetail extends ManagerFlow {
  steps: ManagerFlowStep[];
  return_steps: ManagerFlowStep[];
}

export interface ManagerOrganism {
  organism_id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  services: string[];
  flows: string[];
  readiness: string;
  services_count?: number;
  flows_count?: number;
}

export interface ManagerStoreAudit {
  store_id: string;
  grade: string;
  catalog: { total: number; active: number; draft: number; archived: number };
  branding_ok: boolean;
  has_images: boolean;
  issues: string[];
  generated_at: string;
}

async function managerFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${MANAGER_BASE}${path}`, options);
  if (!res.ok) throw new Error(`Manager API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const managerApi = {
  health: () => managerFetch<{ status: string }>('/health'),

  dashboard: (refresh = false) =>
    managerFetch<ManagerDashboard>(`/dashboard${refresh ? '?refresh=true' : ''}`),

  categories: () =>
    managerFetch<{ categories: ManagerFlowCategory[] }>('/categories').then(d => d.categories),

  flows: (category?: string) =>
    managerFetch<{ flows: ManagerFlow[] }>(category ? `/flows?category=${category}` : '/flows').then(d => d.flows),

  flowDetail: (flowId: string) =>
    managerFetch<ManagerFlowDetail>(`/flows/${flowId}`),

  organisms: () =>
    managerFetch<{ organisms: ManagerOrganism[]; readiness: Record<string, number> }>('/organisms'),

  ecosystem: () =>
    managerFetch<{ services: Record<string, ManagerService> }>('/ecosystem'),

  auditStore: (storeId: string) =>
    managerFetch<ManagerStoreAudit>(`/stores/${storeId}/audit`, { method: 'POST' }),

  guardian: () =>
    managerFetch<Record<string, unknown>>('/guardian'),

  nightlyAudit: () =>
    managerFetch<Record<string, unknown>>('/nightly-audit', { method: 'POST' }),

  healStore: (storeId: string) =>
    managerFetch<Record<string, unknown>>(`/stores/${storeId}/heal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    }),

  nightlyHeal: () =>
    managerFetch<Record<string, unknown>>('/nightly-heal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    }),
};

// ═══════════════════════════════════════════════════
// STORE PROFILES (Pipeline V25.18 Step 10)
// Fuente única de la Capa 2 del Skin Engine (datos + colores por tienda).
// Cache en memoria — TTL 60s. El pipeline regenera perfiles por tienda
// al terminar cada job, por lo que 1 min es seguro.
// ═══════════════════════════════════════════════════

import type {
  StoreProfile,
  StoreProfileListResponse,
  StoreProfileByIndustryResponse,
} from '@/types/store-profile';

type CacheEntry<T> = { at: number; data: T };
const PROFILE_TTL_MS = 60_000;
const _profileCache = new Map<string, CacheEntry<unknown>>();

async function cachedJson<T>(key: string, url: string): Promise<T> {
  const hit = _profileCache.get(key);
  if (hit && Date.now() - hit.at < PROFILE_TTL_MS) {
    return hit.data as T;
  }
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) {
    throw new Error(`${url} → HTTP ${r.status}`);
  }
  const data = (await r.json()) as T;
  _profileCache.set(key, { at: Date.now(), data });
  return data;
}

/** List 16 summary rows — `GET /store-profiles`. */
export function fetchStoreProfiles(): Promise<StoreProfileListResponse> {
  return cachedJson<StoreProfileListResponse>(
    'list',
    `${ODI_API}/store-profiles`
  );
}

/** Full profile for a single store — `GET /store-profiles/{code}`. */
export function fetchStoreProfile(storeCode: string): Promise<StoreProfile> {
  const code = storeCode.toLowerCase();
  return cachedJson<StoreProfile>(
    `profile:${code}`,
    `${ODI_API}/store-profiles/${code}`
  );
}

/** Stores filtered by industry — `GET /store-profiles/by-industry/{industry}`. */
export function fetchStoresForIndustry(
  industry: string
): Promise<StoreProfileByIndustryResponse> {
  const ind = industry.toLowerCase();
  return cachedJson<StoreProfileByIndustryResponse>(
    `industry:${ind}`,
    `${ODI_API}/store-profiles/by-industry/${ind}`
  );
}

/** Drop cache — use when you know the pipeline just wrote a new profile. */
export function clearStoreProfilesCache(): void {
  _profileCache.clear();
}

// ═══════════════════════════════════════════════════
// PMC / K0 — Puesto de Mando read-only
// F1A slice 1: ONE endpoint · ONE contract · ZERO mutations.
// Auth domain: ODI opaque session stored as localStorage `odi_session`.
// No /auth/validate warm-up, no Supabase token bridge, no bypass keys.
// ═══════════════════════════════════════════════════

export interface PmcOverall {
  estado: "ok" | "parcial" | "no_medible" | string;
  secciones_totales: number | null;
  secciones_medidas: number | null;
  secciones_degradadas: number | null;
  secciones_no_aplicables: number | null;
}

export interface PmcOperadorData {
  human_id: string | null;
  authority_level: number | null;
  activo: boolean | null;
  estado: string | null;
}

export interface PmcCanalData {
  dispositivos: number | null;
  dispositivos_activos: number | null;
  en_hold_de_captura: number | null;
  sesiones_ojo_activas: number | null;
  ultimo_latido: string | null;
}

export interface PmcSection<T> {
  status: string | null;
  error_code: string | null;
  source: string | null;
  observed_at: string | null;
  data: T | null;
}

export interface PmcReadModel {
  schema?: string;
  version?: string;
  generated_at?: string;
  overall: PmcOverall;
  sections: {
    operador?: PmcSection<PmcOperadorData>;
    canal?: PmcSection<PmcCanalData>;
    [key: string]: unknown;
  };
}

export type PmcApiErrorCode = "AUTH_REQUIRED" | "FORBIDDEN" | "UNAVAILABLE" | "HTTP_ERROR" | "NETWORK_ERROR";

export class PmcApiError extends Error {
  code: PmcApiErrorCode;
  status: number | null;

  constructor(code: PmcApiErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = "PmcApiError";
    this.code = code;
    this.status = status;
  }
}

function getOdiSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("odi_session");
  return token && token.trim() ? token : null;
}

async function fetchPmcReadModel(): Promise<PmcReadModel> {
  const token = getOdiSessionToken();
  if (!token) {
    throw new PmcApiError("AUTH_REQUIRED", "Sesión ODI requerida.");
  }

  let response: Response;
  try {
    response = await fetch(`${ODI_API}/ecosistema/pmc/read-model`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new PmcApiError("NETWORK_ERROR", "No fue posible alcanzar K0.");
  }

  if (response.status === 401) {
    // Evita un bucle con una sesión ODI inválida/expirada. Nunca imprime el token.
    if (typeof window !== "undefined" && window.localStorage.getItem("odi_session") === token) {
      window.localStorage.removeItem("odi_session");
    }
    throw new PmcApiError("AUTH_REQUIRED", "La sesión ODI no es válida o expiró.", 401);
  }
  if (response.status === 403) {
    throw new PmcApiError("FORBIDDEN", "La identidad actual no satisface la autoridad efectiva de PMC.", 403);
  }
  if (response.status === 503) {
    throw new PmcApiError("UNAVAILABLE", "K0 no está disponible.", 503);
  }
  if (!response.ok) {
    throw new PmcApiError("HTTP_ERROR", `K0 respondió HTTP ${response.status}.`, response.status);
  }

  return (await response.json()) as PmcReadModel;
}

export const pmcApi = {
  readModel: fetchPmcReadModel,
};
