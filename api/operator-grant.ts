// HUMAN_GATED_GUARD_DERIVED_CONTRACT_R1
// Authenticated one-shot transport only. No device/audience/execution/time authority.

const UPSTREAM_GRANT_URL =
  "https://api.liveodi.com/ecosistema/device-pairing/grant";
const UPSTREAM_TIMEOUT_MS = 8_000;

function setNoStoreHeaders(res: any) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, noarchive, nosnippet");
}

function readExactEmptyBody(raw: unknown): boolean {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length === 0
  );
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

  // The web request carries no mint authority. Anything except {} is rejected
  // before the single upstream POST.
  if (!readExactEmptyBody(req.body)) {
    return res.status(400).json({ ok: false, error: "BODY_NOT_EXACT_EMPTY_OBJECT" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(UPSTREAM_GRANT_URL, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    // Forward upstream bytes and status without semantic remapping. In particular:
    // no expiry reconstruction, no local budget calculation, no secret parsing.
    const bytes = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    return res.status(upstream.status).send(bytes);
  } catch {
    // Once the upstream POST has been attempted, mint state is unknown. Never retry.
    return res.status(controller.signal.aborted ? 504 : 502).json({
      ok: false,
      error: "UPSTREAM_GRANT_STATE_UNKNOWN",
      retryable: false,
    });
  } finally {
    clearTimeout(timer);
  }
}
