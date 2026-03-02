// src/context/SkinProvider.tsx
// Contexto React con skin detectada por hostname

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectSkin } from "@/lib/skin-engine";
import { DEFAULT_SKIN, type SkinConfig } from "@/lib/skin-config";

const SkinContext = createContext<SkinConfig>(DEFAULT_SKIN);

export function useSkin() {
  return useContext(SkinContext);
}

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<SkinConfig>(DEFAULT_SKIN);

  useEffect(() => {
    const detected = detectSkin();
    setSkin(detected);

    // Aplicar CSS custom properties
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
      {children}
    </SkinContext.Provider>
  );
}
