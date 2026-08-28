export const BRIDGE_PARENT_ORIGIN = "http://tauri.localhost";
export const BRIDGE_SOURCE = "odi-bridge";
export const BRIDGE_PROTOCOL_VERSION = "0.1.1";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidBridgeDeviceId(value) {
  return typeof value === "string" && UUID_V4.test(value);
}

export function parseBridgeDeviceMessage({ origin, fromParent, data, expectedPingRequestId = null }) {
  if (!fromParent || origin !== BRIDGE_PARENT_ORIGIN) return null;
  if (!data || typeof data !== "object" || data.source !== BRIDGE_SOURCE) return null;

  if (data.type === "bridge:ready") {
    const payload = data.data;
    if (!payload || typeof payload !== "object") return null;
    if (payload.version !== BRIDGE_PROTOCOL_VERSION) return null;
    if (!isValidBridgeDeviceId(payload.device_id)) return null;
    return { kind: "ready", deviceId: payload.device_id, version: payload.version };
  }

  if (data.type === "bridge:response" && data.in_reply_to === "bridge:ping" && data.ok === true) {
    if (!expectedPingRequestId || data.request_id !== expectedPingRequestId) return null;
    const payload = data.data;
    if (!payload || typeof payload !== "object" || payload.pong !== true) return null;
    if (payload.version !== BRIDGE_PROTOCOL_VERSION) return null;
    if (!isValidBridgeDeviceId(payload.device_id)) return null;
    return { kind: "ping", deviceId: payload.device_id, version: payload.version };
  }

  return null;
}

export function reduceBridgeDeviceState(state, candidateDeviceId) {
  if (!isValidBridgeDeviceId(candidateDeviceId)) return state;
  if (!state.deviceId) {
    return { deviceId: candidateDeviceId, status: "READY", acceptedCount: state.acceptedCount + 1 };
  }
  if (state.deviceId === candidateDeviceId) return state;
  return { ...state, status: "CONFLICT" };
}

export function makeBridgePing(requestId, now = Date.now()) {
  if (typeof requestId !== "string" || requestId.length < 8) throw new Error("invalid request id");
  return { type: "bridge:ping", request_id: requestId, ts: now };
}
