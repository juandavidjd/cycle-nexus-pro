// PAIRING_FORWARDER_CONVERGENCE_R1 · operator grant forwarder (Stage B, bound to the served issuer envelope)
//
// Boundary: operator UI (same-origin POST /api/operator-grant, human Bearer) -> THIS forwarder -> issuer
// (gateway POST /ecosistema/device-pairing/grant). The served issuer answers
//   { ok: true, grant_id, pairing_secret, credential_type, expires_in_seconds }
// and never an absolute expires_at. This forwarder accepts exactly that envelope and derives the absolute
// expiry at the edge as a LOWER BOUND: startedAtMs (captured before the request left, hence before the
// issuer's insert) + expires_in_seconds. The UI keeps parsing { ok, grant_id, pairing_secret, expires_at }.
//
// Invariants: POST only · habitat/preview hosts only · human Bearer forwarded verbatim · one upstream
// request, never a retry · no logging · no-store · fail closed on any envelope the issuer did not promise.

const UPSTREAM_GRANT_URL =
  "https://api.liveodi.com/ecosistema/device-pairing/grant";
const UPSTREAM_TIMEOUT_MS = 8_000;
// MUST equal MIN_START_BUDGET_SECONDS in src/pages/OperatorGrant.tsx (static test asserts equality).
const MIN_START_BUDGET_SECONDS = 90;
const MIN_START_BUDGET_MS = MIN_START_BUDGET_SECONDS * 1000;
const MAX_EXPIRES_IN_SECONDS = 3_600;
const HABITAT_HOST = "liveodi.com";
const PREVIEW_HOST_SUFFIX = ".vercel.app";

const GRANT_BODY = {
  audience_id: null,
  credential_type: "OPAQUE_BEARER_V1",
  intended_device_id: "a44113c9-bdb2-457c-a92e-86f18c81ac2e",
} as const;

type IssuerEnvelope = {
  grant_id: string;
  pairing_secret: string;
  expires_in_seconds: number;
};

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
      body: JSON.stringify(GRANT_BODY),
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
