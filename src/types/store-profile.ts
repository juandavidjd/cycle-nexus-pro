// src/types/store-profile.ts
// Types for /store-profiles/* endpoints served by the ODI gateway (:8815).
// Source of truth: odi_store_profile_generator.py (Pipeline V25.18 Step 10).

export type SkinLayoutId = "habitat" | "srm" | "dental" | "servicios" | "turismo";
export type SkinVoice = "ramona" | "tony";

export interface StoreColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface StoreSkinHints {
  id: string;
  layer: string;
  layout: SkinLayoutId;
  voice: SkinVoice;
  greeting: string;
  domain: string;
  keywords: string[];
}

export interface StoreShopify {
  domain: string;
  url: string;
}

export interface StoreStats {
  total_products: number;
  active: number;
  draft: number;
  categories_count: number;
  avg_price: number;
  max_price: number;
}

export interface StoreCategory {
  name: string;
  count: number;
}

export interface FeaturedProduct {
  sku: string;
  title: string;
  price: number;
  image: string;
}

export interface FitmentSummary {
  skus: number;
  brands: number;
}

export interface StoreGrade {
  final_grade: string;
  content_grade?: string;
  images_grade?: string;
  fitment_grade?: string;
  storefront_grade?: string;
}

export interface StoreMeta {
  title: string;
  description: string;
  og_image: string;
}

/** Full detail — GET /store-profiles/{code} */
export interface StoreProfile {
  store_code: string;
  nombre: string;
  nombre_legal: string;
  slogan: string;
  ciudad: string;
  industry: string;
  industry_sub: string;
  type: string;

  colores: StoreColors;
  logo_url: string;
  favicon_url: string;

  skin: StoreSkinHints;
  shopify: StoreShopify;
  stats: StoreStats;
  categories: StoreCategory[];
  featured_products: FeaturedProduct[];
  fitment_summary: FitmentSummary;
  grade: StoreGrade;
  meta: StoreMeta;

  generated_at: string;
  pipeline_version: string;
}

/** Summary row — GET /store-profiles */
export interface StoreProfileSummary {
  store: string;
  nombre: string;
  industry: string;
  grade: string;
  products: number;
  categories: number;
  featured: number;
  shopify_url: string;
  generated_at: string;
}

export interface StoreProfileListResponse {
  total: number;
  profiles: StoreProfileSummary[];
}

/** Industry row — GET /store-profiles/by-industry/{industry} */
export interface StoreProfileByIndustryRow {
  store: string;
  nombre: string;
  grade: string;
  products: number;
  logo: string;
  shopify_url: string;
  categories: StoreCategory[];
}

export interface StoreProfileByIndustryResponse {
  industry: string;
  total: number;
  stores: StoreProfileByIndustryRow[];
}
