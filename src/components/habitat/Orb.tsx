// src/components/habitat/Orb.tsx
// Viene DIRECTO de odi-flows-definitivo.jsx
// Solo se adapta para recibir color dinamico del API

interface OrbProps {
  size?: number;
  color?: string;
  breathing?: boolean;
}

export function Orb({ size = 64, color = "#3db8ff", breathing = true }: OrbProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 48% 38%, ${color}dd 0%, ${color}88 28%, ${color}44 52%, ${color}11 75%, transparent 100%)`,
        boxShadow: `0 0 ${size * 0.35}px ${color}44, inset 0 0 ${size * 0.3}px ${color}22`,
        animation: breathing ? "orbBreathe 5s ease-in-out infinite" : "none",
        transition: "all 1.2s ease",
      }}
    />
  );
}

// Mapeo de color Orb por modo del API
// Viene directo de odi-flows-definitivo.jsx lineas 321-329
export function getOrbColor(mode?: string): string {
  switch (mode) {
    case "commerce":  return "#2ef08a";  // alive
    case "care":      return "#ff6b8a";  // care
    case "empower":
    case "build":     return "#ff9f43";  // warm
    case "diagnose":
    case "optimize":  return "#49c2ff";  // tony
    default:          return "#3db8ff";  // glow (neutral)
  }
}

export default Orb;
