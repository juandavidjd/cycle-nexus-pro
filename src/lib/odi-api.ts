// ODI API Client — V15: Connects cycle-nexus-pro to API Gateway V14
const API_BASE = import.meta.env.VITE_ODI_API_URL || 'https://api.liveodi.com/odi/v1';

export interface ODIProduct {
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
  products: ODIProduct[];
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
  recent_products: ODIProduct[];
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

export interface ODIChatResponse {
  response: string;
  productos: ODIProduct[];
  session_id?: string;
}

export interface ODIFitmentResult {
  compatible_products: number;
  results: ODIProduct[];
  query: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`ODI API ${res.status}: ${res.statusText}`);
  return res.json();
}

const odiApi = {
  health: () => apiFetch<{ status: string; services: Record<string, string> }>('/health'),

  searchProducts: (q: string, limit = 10) =>
    apiFetch<ODISearchResult>(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getEcosystem: () => apiFetch<ODIEcosystem>('/ecosystem/stores'),

  getStoreSummary: (storeId: string) =>
    apiFetch<ODIStoreSummary>(`/stores/${encodeURIComponent(storeId)}/summary`),

  getProduct360: (sku: string) =>
    apiFetch<ODIProduct360>(`/products/${encodeURIComponent(sku)}/360`),

  searchFitment: (q: string) =>
    apiFetch<ODIFitmentResult>(`/fitment/search?q=${encodeURIComponent(q)}`),

  chat: (message: string, sessionId?: string) =>
    apiFetch<ODIChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    }),
};

export default odiApi;
