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

export async function odiChat(
  message: string,
  sessionId?: string
): Promise<ODIChatResponse> {
  const res = await fetch(`${ODI_API}/odi/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
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
};
