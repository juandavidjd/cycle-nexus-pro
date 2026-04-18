// src/context/SkinProvider.tsx
// ═══════════════════════════════════════════════════
// SKIN ENGINE — DOS CAPAS
// Capa 1 (SkinContext): hostname → layout + voz. Sincrónica, nunca falla.
// Capa 2 (StoreContext): /tienda/:code → colores + datos. Async, nullable.
// Los dos contextos son independientes — componentes consumen el que necesitan.
// ═══════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { detectSkin } from "@/lib/skin-engine";
import {
  DEFAULT_SKIN,
  profileToSkin,
  type SkinConfig,
  type StoreSkin,
} from "@/lib/skin-config";
import {
  fetchStoreProfile,
  fetchStoresForIndustry,
  fetchStoreProfiles,
} from "@/lib/odiApi";
import type {
  StoreProfile,
  StoreProfileByIndustryResponse,
  StoreProfileListResponse,
} from "@/types/store-profile";

// ─── Capa 1: SkinContext (dominio) ───

const SkinContext = createContext<SkinConfig>(DEFAULT_SKIN);

export function useSkin(): SkinConfig {
  return useContext(SkinContext);
}

// ─── Capa 2: StoreContext (tienda activa) ───

interface StoreContextValue {
  storeSkin: StoreSkin | null;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextValue>({
  storeSkin: null,
  isLoading: false,
});

export function useStoreSkin(): StoreSkin | null {
  return useContext(StoreContext).storeSkin;
}

export function useIsStoreLoading(): boolean {
  return useContext(StoreContext).isLoading;
}

// ─── Hooks imperativos para componentes ───

/** Fetch full profile for a store — lazy, cached by TanStack Query. */
export function useStoreProfile(storeCode: string | undefined) {
  return useQuery<StoreProfile, Error>({
    queryKey: ["store-profile", storeCode?.toUpperCase()],
    queryFn: () => fetchStoreProfile(storeCode!),
    enabled: Boolean(storeCode),
    staleTime: 60_000,
    retry: 1,
  });
}

/** Fetch all stores for an industry (for industry landing pages). */
export function useStoresForIndustry(industry: string | undefined) {
  return useQuery<StoreProfileByIndustryResponse, Error>({
    queryKey: ["stores-by-industry", industry?.toLowerCase()],
    queryFn: () => fetchStoresForIndustry(industry!),
    enabled: Boolean(industry),
    staleTime: 60_000,
  });
}

/** Fetch the 16-row list summary — for ecosystem overview. */
export function useAllStoreProfiles() {
  return useQuery<StoreProfileListResponse, Error>({
    queryKey: ["store-profiles-list"],
    queryFn: fetchStoreProfiles,
    staleTime: 60_000,
  });
}

// ─── SkinProvider (aplica Capa 1 + Capa 2 a CSS variables) ───

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<SkinConfig>(DEFAULT_SKIN);

  // Capa 1: detección por hostname
  useEffect(() => {
    const detected = detectSkin();
    setSkin(detected);

    const root = document.documentElement;
    root.setAttribute("data-skin", detected.id);
    root.setAttribute("data-layout", detected.layout);
    root.style.setProperty("--skin-primary", detected.colors.primary);
    root.style.setProperty("--skin-accent", detected.colors.accent);
    root.style.setProperty("--skin-bg", detected.colors.background);
    root.style.setProperty("--skin-surface", detected.colors.surface);
  }, []);

  return (
    <SkinContext.Provider value={skin}>
      <StoreSkinGate>{children}</StoreSkinGate>
    </SkinContext.Provider>
  );
}

// ─── StoreSkinGate: aplica Capa 2 cuando la ruta es /tienda/:storeCode ───

/**
 * Componente interno que detecta `/tienda/:storeCode` desde pathname y activa Capa 2.
 * Debe ir DENTRO de <BrowserRouter> — por eso es hijo de SkinProvider,
 * que a su vez debe envolverse en <BrowserRouter> desde App.tsx.
 *
 * Se usa `useLocation()` (no `useParams()`) porque StoreSkinGate envuelve a
 * <Routes>, por lo que no hay route match activo cuando corre este hook.
 */
function StoreSkinGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const storeCode = useMemo(() => {
    const m = pathname.match(/^\/tienda\/([^/?#]+)/i);
    return m ? m[1] : undefined;
  }, [pathname]);

  const { data: profile, isLoading } = useStoreProfile(storeCode);

  const storeSkin = useMemo<StoreSkin | null>(
    () => (profile ? profileToSkin(profile) : null),
    [profile]
  );

  // Aplica/remueve overrides de colores de Capa 2
  useEffect(() => {
    const root = document.documentElement;
    if (storeSkin) {
      root.setAttribute("data-store", storeSkin.storeCode);
      root.style.setProperty("--store-primary", storeSkin.colors.primary);
      root.style.setProperty("--store-secondary", storeSkin.colors.secondary);
      root.style.setProperty(
        "--store-accent",
        storeSkin.colors.accent || storeSkin.colors.primary
      );
    } else {
      root.removeAttribute("data-store");
      root.style.removeProperty("--store-primary");
      root.style.removeProperty("--store-secondary");
      root.style.removeProperty("--store-accent");
    }
  }, [storeSkin]);

  const value = useMemo<StoreContextValue>(
    () => ({ storeSkin, isLoading }),
    [storeSkin, isLoading]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
