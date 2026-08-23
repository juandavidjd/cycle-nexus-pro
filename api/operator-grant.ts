export default function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, noarchive, nosnippet");
  return res.status(503).json({ ok: false, error: "OPERATOR_NOT_CALIBRATED" });
}
