// PAIRING_FORWARDER_CONVERGENCE_R2 · governed Bridge device session for /operator-grant.
//
// This is the H3A consumer (the listener-then-ping effect of LiveODIBridgeSurface.tsx) expressed as a framework-free
// session so the operator page can hold the SAME governed device fact: an event accepted by the unchanged Bridge
// contract (origin/source/protocol/UUIDv4) reduced by the unchanged H3A reducer into volatile state. No new protocol,
// no new message, no storage: the state lives only in memory for the lifetime of the page.
//
// Standalone (no parent frame) ⇒ no device fact exists: nothing is listened to, nothing is posted, state stays
// WAITING with no device, and grantRequestBody() can never produce a request.
import {
  BRIDGE_PARENT_ORIGIN,
  isValidBridgeDeviceId,
  makeBridgePing,
  parseBridgeDeviceMessage,
  reduceBridgeDeviceState,
} from "./bridgeDeviceContract.js";

export const INITIAL_BRIDGE_DEVICE_STATE = Object.freeze({
  deviceId: null,
  status: "WAITING",
  acceptedCount: 0,
});

export function makeBridgePingRequestId(
  cryptoLike = typeof crypto !== "undefined" ? crypto : undefined,
  now = Date.now(),
  rand = Math.random,
) {
  if (cryptoLike && typeof cryptoLike.randomUUID === "function") return `bridge_ping_${cryptoLike.randomUUID()}`;
  return `bridge_ping_${now}_${rand().toString(36).slice(2)}`;
}

export function startBridgeDeviceSession(win, onChange, requestId = makeBridgePingRequestId()) {
  if (!win || !win.parent || win.parent === win) {
    return { standalone: true, getState: () => INITIAL_BRIDGE_DEVICE_STATE, stop() {} };
  }

  let state = INITIAL_BRIDGE_DEVICE_STATE;
  let expectedPingRequestId = null;

  const onMessage = (event) => {
    const parsed = parseBridgeDeviceMessage({
      origin: event.origin,
      fromParent: event.source === win.parent,
      data: event.data,
      expectedPingRequestId,
    });
    if (!parsed) return;

    const next = reduceBridgeDeviceState(state, parsed.deviceId);
    if (next === state) return; // duplicate ready/pong: no second consumption
    state = next;
    onChange(next);
  };

  // Listener first, then ping (same order as H3A): closes the 200 ms bridge:ready race without widening trust.
  win.addEventListener("message", onMessage);
  expectedPingRequestId = requestId;
  win.parent.postMessage(makeBridgePing(requestId), BRIDGE_PARENT_ORIGIN);

  return {
    standalone: false,
    getState: () => state,
    stop() {
      win.removeEventListener("message", onMessage);
      expectedPingRequestId = null;
    },
  };
}

// The ONLY producer of the grant request body. Eligibility and body are derived from the same accepted state object:
// READY with an accepted device ⇒ { intended_device_id }; WAITING / CONFLICT / standalone ⇒ null (no request can be built).
export function grantRequestBody(state) {
  if (!state || state.status !== "READY" || state.acceptedCount < 1 || !isValidBridgeDeviceId(state.deviceId)) {
    return null;
  }
  return { intended_device_id: state.deviceId };
}
