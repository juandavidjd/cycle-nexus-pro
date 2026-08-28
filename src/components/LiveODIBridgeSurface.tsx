import { useEffect, useRef, useState } from "react";
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

  return (
    <div
      data-odi-bridge-device-status={bridgeState.status}
      data-odi-bridge-device-present={bridgeState.deviceId ? "yes" : "no"}
      data-odi-bridge-device-consume-count={String(bridgeState.acceptedCount)}
    >
      <LiveODI />
    </div>
  );
}
