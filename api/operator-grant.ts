// PAIRING_FORWARDER_CONVERGENCE_R2 · operator grant forwarder (Stage B, bound to the served issuer envelope)
//
// Boundary: operator UI (same-origin POST /api/operator-grant, human Bearer) -> THIS forwarder -> issuer
// (gateway POST /ecosistema/device-pairing/grant). The served issuer answers
//   { ok: true, grant_id, pairing_secret, credential_type, expires_in_seconds }
// and never an absolute expires_at. This forwarder accepts exactly that envelope and derives the absolute
// expiry at the edge as a LOWER BOUND: startedAtMs (captured before the request left, hence before the
// issuer's insert) + expires_in_seconds. The UI keeps parsing { ok, grant_id, pairing_secret, expires_at }.
//
// R2: the intended device is no longer a compile-time constant. The operator page supplies it from the governed
// Bridge runtime state (H3A: accepted bridge:ready / bridge:response, UUIDv4, volatile) as the ONLY variable field
// of an exact request body { intended_device_id }. This forwarder validates its shape and transports it; the human
// Bearer remains the sole issuance authority and the issuer remains the sole minting authority. A device id is
// never an authenticator here.
//
// Invariants: POST only · habitat/preview hosts only · human Bearer forwarded verbatim · exact body (one key) ·
// one upstream request, never a retry · no logging · no-store · fail closed on any envelope the issuer did not promise.

const UPSTREAM_GRANT_URL =
  "https://api.liveodi.com/ecosistema/device-pairing/grant";
const UPSTREAM_TIMEOUT_MS = 8_000;
// MUST equal MIN_START_BUDGET_SECONDS in src/pages/OperatorGrant.tsx (static test asserts equality).
const MIN_START_BUDGET_SECONDS = 90;
const MIN_START_BUDGET_MS = MIN_START_BUDGET_SECONDS * 1000;
const MAX_EXPIRES_IN_SECONDS = 3_600;
const HABITAT_HOST = "liveodi.com";
const PREVIEW_HOST_SUFFIX = ".vercel.app";

// Governed, fixed fields of the issuer request. The client cannot steer them.
const GRANT_BODY_FIXED = {
  audience_id: null,
  credential_type: "OPAQUE_BEARER_V1",
} as const;

// Same shape rule as isValidBridgeDeviceId in src/components/bridge/bridgeDeviceContract.js (UUID v4, variant 8/9/a/b).
// Duplicated because this serverless function stays self-contained; the static test asserts the two sources are equal.
const INTENDED_DEVICE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTENDED_DEVICE_ID_LENGTH = 36;

type IssuerEnvelope = {
  grant_id: string;
  pairing_secret: string;
  expires_in_seconds: number;
};

type ExactBodyResult =
  | { ok: true; intended_device_id: string }
  | { ok: false; error: "INTENDED_DEVICE_ID_REQUIRED" | "BODY_NOT_EXACT" | "INVALID_INTENDED_DEVICE_ID" };

function setNoStoreHeaders(res: any) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, noarchive, nosnippet");
}

function requestHost(req: any): string | null {
  const forwarded = req.headers?.["x-forwarded-host"];
  const raw = typeof forwarded === "string" && forwarded.length > 0 ? forwarded : req.headers?.host;
  if (typeof raw !== "string" || raw.length === 0) return null;
  const first = raw.split(",")[0].trim().toLowerCase();
  const host = first.replace(/:\d+$/, "");
  return host.length > 0 ? host : null;
}

function isHabitatOrPreviewHost(host: string): boolean {
  return host.replace(/^www\./, "") === HABITAT_HOST || host.endsWith(PREVIEW_HOST_SUFFIX);
}

// Exact body: a JSON object whose ONLY key is intended_device_id, a strict UUIDv4 string. Anything else is rejected
// before any upstream request (missing / empty / extra keys / wrong type / wrong shape / non-object / arrays).
function readExactBody(raw: unknown): ExactBodyResult {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, error: "INTENDED_DEVICE_ID_REQUIRED" };
    }
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "INTENDED_DEVICE_ID_REQUIRED" };
  }
  const keys = Object.keys(value as Record<string, unknown>);
  if (!keys.includes("intended_device_id")) {
    return { ok: false, error: "INTENDED_DEVICE_ID_REQUIRED" };
  }
  if (keys.length !== 1) {
    return { ok: false, error: "BODY_NOT_EXACT" };
  }
  const id = (value as Record<string, unknown>).intended_device_id;
  if (
    typeof id !== "string" ||
    id.length !== INTENDED_DEVICE_ID_LENGTH ||
    !INTENDED_DEVICE_ID_RE.test(id)
  ) {
    return { ok: false, error: "INVALID_INTENDED_DEVICE_ID" };
  }
  return { ok: true, intended_device_id: id };
}

function parseIssuerEnvelope(input: unknown): IssuerEnvelope | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Record<string, unknown>;
  if (x.ok !== true) return null;
  if (typeof x.grant_id !== "string" || x.grant_id.length === 0) return null;
  if (
    typeof x.pairing_secret !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(x.pairing_secret)
  ) {
    return null;
  }
  const ttl = x.expires_in_seconds;
  if (
    typeof ttl !== "number" ||
    !Number.isInteger(ttl) ||
    ttl <= 0 ||
    ttl > MAX_EXPIRES_IN_SECONDS
  ) {
    return null;
  }
  return { grant_id: x.grant_id, pairing_secret: x.pairing_secret, expires_in_seconds: ttl };
}

function upstreamErrorCode(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const x = payload as Record<string, unknown>;
    const raw =
      typeof x.error === "string" ? x.error : typeof x.detail === "string" ? x.detail : "";
    const code = raw.toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 48);
    if (code.length > 0) return `UPSTREAM_${code}`;
  }
  return "UPSTREAM_GRANT_REJECTED";
}

export default async function handler(req: any, res: any) {
  setNoStoreHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const host = requestHost(req);
  if (host === null || !isHabitatOrPreviewHost(host)) {
    return res.status(403).json({ ok: false, error: "TENANT_NOT_ALLOWED" });
  }

  const authorization =
    typeof req.headers?.authorization === "string"
      ? req.headers.authorization
      : "";

  if (!/^Bearer\s+\S+$/.test(authorization)) {
    return res.status(401).json({ ok: false, error: "HUMAN_BEARER_REQUIRED" });
  }

  // Body gate after the human gate: an unauthenticated caller learns nothing about body validation.
  const body = readExactBody(req.body);
  if (!body.ok) {
    return res.status(400).json({ ok: false, error: body.error });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  // Conservative anchor: taken BEFORE the request leaves, so it precedes the issuer's insert and the
  // derived expiry can only be earlier than (never later than) the DB-authoritative one.
  const startedAtMs = Date.now();

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM_GRANT_URL, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...GRANT_BODY_FIXED, intended_device_id: body.intended_device_id }),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    // The request may or may not have reached the issuer: a grant MAY exist. Never retry here.
    if (controller.signal.aborted) {
      return res
        .status(504)
        .json({ ok: false, error: "UPSTREAM_TIMEOUT_GRANT_STATE_UNKNOWN" });
    }
    return res
      .status(502)
      .json({ ok: false, error: "UPSTREAM_UNAVAILABLE_GRANT_STATE_UNKNOWN" });
  }

  let payload: unknown = null;
  let payloadIsJson = true;
  try {
    payload = await upstream.json();
  } catch {
    payloadIsJson = false;
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    const status =
      Number.isInteger(upstream.status) && upstream.status >= 400 && upstream.status <= 599
        ? upstream.status
        : 502;
    return res.status(status).json({
      ok: false,
      error: upstreamErrorCode(payloadIsJson ? payload : null),
      upstream_status: upstream.status,
    });
  }

  if (!payloadIsJson) {
    return res.status(502).json({ ok: false, error: "UPSTREAM_INVALID_JSON" });
  }

  const grant = parseIssuerEnvelope(payload);
  if (!grant) {
    return res.status(502).json({ ok: false, error: "UPSTREAM_INVALID_ENVELOPE" });
  }

  const expiresAtMs = startedAtMs + grant.expires_in_seconds * 1000;
  const remainingMs = expiresAtMs - Date.now();

  if (remainingMs < MIN_START_BUDGET_MS) {
    // A grant was issued and is NOT presented: fail closed, say so, never retry.
    return res.status(409).json({
      ok: false,
      error: "INSUFFICIENT_START_BUDGET",
      min_start_budget_seconds: MIN_START_BUDGET_SECONDS,
      grant_state: "ISSUED_NOT_PRESENTED",
    });
  }

  return res.status(200).json({
    ok: true,
    grant_id: grant.grant_id,
    pairing_secret: grant.pairing_secret,
    expires_at: new Date(expiresAtMs).toISOString(),
    expires_in_seconds: grant.expires_in_seconds,
    expiry_basis: "DERIVED_LOWER_BOUND",
  });
}
