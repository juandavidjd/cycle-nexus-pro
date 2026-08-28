import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BRIDGE_PARENT_ORIGIN,
  makeBridgePing,
  parseBridgeDeviceMessage,
  reduceBridgeDeviceState,
} from "../src/components/bridge/bridgeDeviceContract.js";

const DEV_A = "a44113c9-bdb2-457c-a92e-86f18c81ac2e";
const DEV_B = "b44113c9-bdb2-457c-a92e-86f18c81ac2e";
const PING = "bridge_ping_12345678";
const ready = (id = DEV_A) => ({ source: "odi-bridge", type: "bridge:ready", data: { version: "0.1.1", device_id: id }, ts: 1 });
const pong = (id = DEV_A) => ({ source: "odi-bridge", type: "bridge:response", request_id: PING, in_reply_to: "bridge:ping", ok: true, data: { version: "0.1.1", device_id: id, pong: true }, ts: 2 });

// T1 normal ready.
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: ready() })?.deviceId, DEV_A);

// T2 ready missed before mount: correlated ping response recovers current device.
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: pong(), expectedPingRequestId: PING })?.kind, "ping");
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: pong(), expectedPingRequestId: "wrong_request" }), null);
const ping = makeBridgePing(PING, 7);
assert.deepEqual(ping, { type: "bridge:ping", request_id: PING, ts: 7 });

// T3 duplicate same device is idempotent and consumed once.
const s0 = { deviceId: null, status: "WAITING", acceptedCount: 0 };
const s1 = reduceBridgeDeviceState(s0, DEV_A);
const s2 = reduceBridgeDeviceState(s1, DEV_A);
assert.equal(s1.acceptedCount, 1);
assert.equal(s2, s1);

// T4 malformed / missing device_id rejected.
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: ready("not-a-uuid") }), null);
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: { source: "odi-bridge", type: "bridge:ready", data: { version: "0.1.1" } } }), null);

// T5 wrong origin/source/contract rejected.
assert.equal(parseBridgeDeviceMessage({ origin: "https://liveodi.com", fromParent: true, data: ready() }), null);
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: false, data: ready() }), null);
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: { ...ready(), source: "attacker" } }), null);
assert.equal(parseBridgeDeviceMessage({ origin: BRIDGE_PARENT_ORIGIN, fromParent: true, data: { ...ready(), data: { version: "9.9.9", device_id: DEV_A } } }), null);

// Device switch in one mounted session is a hard local stop; original device remains pinned.
const conflict = reduceBridgeDeviceState(s1, DEV_B);
assert.equal(conflict.status, "CONFLICT");
assert.equal(conflict.deviceId, DEV_A);
assert.equal(conflict.acceptedCount, 1);

// T6/T7/T8 static scope fences: standalone is explicitly guarded; no auth, persistence, network bootstrap, Ojo, camera.
const surface = fs.readFileSync(new URL("../src/components/LiveODIBridgeSurface.tsx", import.meta.url), "utf8");
assert.match(surface, /window\.parent === window/);
for (const forbidden of ["localStorage", "sessionStorage", "fetch(", "Authorization", "human_id", "odi_session", "bridge:screen", "observation", "camera", "getUserMedia"]) {
  assert.equal(surface.includes(forbidden), false, `forbidden token present: ${forbidden}`);
}
assert.match(surface, /addEventListener\("message"/);
assert.match(surface, /removeEventListener\("message"/);
assert.match(surface, /postMessage\(makeBridgePing\(requestId\), BRIDGE_PARENT_ORIGIN\)/);

console.log("H3A_LIVEODI_BRIDGE_DEVICE_CONSUMER_FALSIFIERS=PASS");
console.log("T1_T8=PASS");
