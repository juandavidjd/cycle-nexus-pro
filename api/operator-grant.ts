const UPSTREAM_GRANT_URL =
  "https://api.liveodi.com/ecosistema/device-pairing/grant";
const MIN_START_BUDGET_MS = 119_000;

const GRANT_BODY = {
  audience_id: null,
  credential_type: "OPAQUE_BEARER_V1",
  intended_device_id: "a44113c9-bdb2-457c-a92e-86f18c81ac2e",
} as const;

type GrantEnvelope = {
  ok: true;
  grant_id: string;
  pairing_secret: string;
  expires_at: string;
};

function setNoStoreHeaders(res: any) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, noarchive, nosnippet");
}

function parseGrantEnvelope(input: unknown): GrantEnvelope | null {
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
  if (typeof x.expires_at !== "string") return null;
  if (!Number.isFinite(Date.parse(x.expires_at))) return null;
  return {
    ok: true,
    grant_id: x.grant_id,
    pairing_secret: x.pairing_secret,
    expires_at: x.expires_at,
  };
}

export default async function handler(req: any, res: any) {
  setNoStoreHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const authorization =
    typeof req.headers?.authorization === "string"
      ? req.headers.authorization
      : "";

  if (!/^Bearer\s+\S+$/.test(authorization)) {
    return res.status(401).json({ ok: false, error: "HUMAN_BEARER_REQUIRED" });
  }

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
    });
  } catch {
    return res.status(502).json({ ok: false, error: "UPSTREAM_UNAVAILABLE" });
  }

  const receivedAtMs = Date.now();

  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch {
    return res.status(502).json({ ok: false, error: "UPSTREAM_INVALID_JSON" });
  }

  if (!upstream.ok) {
    return res
      .status(upstream.status)
      .json({ ok: false, error: "UPSTREAM_GRANT_REJECTED" });
  }

  const grant = parseGrantEnvelope(payload);
  if (!grant) {
    return res.status(502).json({ ok: false, error: "UPSTREAM_INVALID_ENVELOPE" });
  }

  const expiresAtMs = Date.parse(grant.expires_at);
  const remainingMs = expiresAtMs - receivedAtMs;

  if (remainingMs < MIN_START_BUDGET_MS) {
    return res.status(409).json({
      ok: false,
      error: "INSUFFICIENT_START_BUDGET",
      min_start_budget_seconds: MIN_START_BUDGET_MS / 1000,
    });
  }

  return res.status(200).json({
    ok: true,
    grant_id: grant.grant_id,
    pairing_secret: grant.pairing_secret,
    expires_at: grant.expires_at,
  });
}
