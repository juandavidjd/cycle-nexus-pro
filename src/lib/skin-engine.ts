// src/lib/skin-engine.ts
// Detector de skin por hostname

import { SKINS, DEFAULT_SKIN, type SkinConfig } from "./skin-config";

export function detectSkin(): SkinConfig {
  if (typeof window === "undefined") return DEFAULT_SKIN;

  const hostname = window.location.hostname;

  // Exact match
  if (SKINS[hostname]) return SKINS[hostname];

  // Subdomain match (www.liveodi.com → liveodi.com)
  const bare = hostname.replace(/^www\./, "");
  if (SKINS[bare]) return SKINS[bare];

  // Default: ODI habitat
  return DEFAULT_SKIN;
}
