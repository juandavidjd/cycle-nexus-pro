import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import LiveODI from "./LiveODI";
import {
  BRIDGE_PARENT_ORIGIN,
  makeBridgePing,
  parseBridgeDeviceMessage,
  reduceBridgeDeviceState,
} from "./bridge/bridgeDeviceContract.js";

type BridgeDeviceState = {
  deviceId: string | null;
  status: "WAITING" | "READY" | "CONFLICT";
  acceptedCount: number;
};

const initialBridgeState: BridgeDeviceState = {
  deviceId: null,
  status: "WAITING",
  acceptedCount: 0,
};

function makeRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `bridge_ping_${crypto.randomUUID()}`;
  return `bridge_ping_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// H3A_NONSECRET_OBSERVABILITY_SURFACE_R1 · render ONLY the three already-computed witness values.
// Never the device_id, never any secret or identity-bearing material. Pure function of state.
export function bridgeWitnessText(state: BridgeDeviceState): string {
  return `ODI BRIDGE · ${state.status} · PRESENT=${state.deviceId ? "yes" : "no"} · CONSUMED=${state.acceptedCount}`;
}

const WITNESS_COLOR: Record<BridgeDeviceState["status"], string> = {
  WAITING: "#ffcc00",
  READY: "#3af08f",
  CONFLICT: "#ff4444",
};

const WITNESS_STYLE: CSSProperties = {
  position: "fixed",
  top: 6,
  left: 8,
  zIndex: 2147483647,
  pointerEvents: "none",
  padding: "2px 6px",
  borderRadius: 4,
  background: "rgba(3, 10, 24, 0.85)",
  font: "600 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
};

export default function LiveODIBridgeSurface() {
  const [bridgeState, setBridgeState] = useState<BridgeDeviceState>(initialBridgeState);
  const stateRef = useRef<BridgeDeviceState>(initialBridgeState);
  const pingRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = bridgeState;
  }, [bridgeState]);

  useEffect(() => {
    // Standalone browser remains a normal LiveODI surface. No device identity is fabricated.
    if (window.parent === window) return;

    const onBridgeMessage = (event: MessageEvent) => {
      const parsed = parseBridgeDeviceMessage({
        origin: event.origin,
        fromParent: event.source === window.parent,
        data: event.data,
        expectedPingRequestId: pingRequestIdRef.current,
      });
      if (!parsed) return;

      const next = reduceBridgeDeviceState(stateRef.current, parsed.deviceId) as BridgeDeviceState;
      if (next === stateRef.current) return; // duplicate ready/pong: no second consumption
      stateRef.current = next;
      setBridgeState(next);
    };

    // Listener first, then ping: closes the 200 ms bridge:ready race without widening trust.
    window.addEventListener("message", onBridgeMessage);

    const requestId = makeRequestId();
    pingRequestIdRef.current = requestId;
    window.parent.postMessage(makeBridgePing(requestId), BRIDGE_PARENT_ORIGIN);

    return () => {
      window.removeEventListener("message", onBridgeMessage);
      pingRequestIdRef.current = null;
    };
  }, []);

  // Same predicate as the listener effect: the witness exists only when embedded under a parent frame.
  const embedded = typeof window !== "undefined" && window.parent !== window;

  return (
    <div
      data-odi-bridge-device-status={bridgeState.status}
      data-odi-bridge-device-present={bridgeState.deviceId ? "yes" : "no"}
      data-odi-bridge-device-consume-count={String(bridgeState.acceptedCount)}
    >
      {embedded && (
        <div
          data-odi-bridge-witness="1"
          role="status"
          aria-live="polite"
          style={{ ...WITNESS_STYLE, color: WITNESS_COLOR[bridgeState.status] }}
        >
          {bridgeWitnessText(bridgeState)}
        </div>
      )}
      <LiveODI />
    </div>
  );
}
