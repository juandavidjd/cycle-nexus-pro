import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const AUTH_STORAGE_KEY = "odi_session";
const AUTH_VALIDATE_URL = "https://api.liveodi.com/auth/validate";
const SW_IDENTITY = "ODI_OPERATOR_SW_SAFE_R1";
const SW_TIMEOUT_MS = 5000;
const REHEARSAL_TTL_SECONDS = 120;

type SwState =
  | "CHECKING"
  | "PASS"
  | "FAIL_NO_CONTROLLER"
  | "FAIL_IDENTITY_MISMATCH"
  | "FAIL_TIMEOUT"
  | "WAITING_CONTROLLERCHANGE";

type AuthState = "CHECKING" | "PASS" | "FAIL";

type PresentedGrant = {
  grantId: string;
  value: string;
  expiresAtMs: number;
  provenance: "LOCAL_IN_MEMORY_REHEARSAL";
};

function makeBase64Url43(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseGrantEnvelope(input: unknown): { grantId: string; value: string; expiresAtMs: number } | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Record<string, unknown>;
  if (x.ok !== true) return null;
  if (typeof x.grant_id !== "string" || x.grant_id.length === 0) return null;
  if (typeof x.pairing_secret !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(x.pairing_secret)) return null;
  if (typeof x.expires_at !== "string") return null;
  const expiresAtMs = Date.parse(x.expires_at);
  if (!Number.isFinite(expiresAtMs)) return null;
  return { grantId: x.grant_id, value: x.pairing_secret, expiresAtMs };
}

function waitForControllerChange(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(value);
    };
    const onChange = () => done(true);
    const timer = window.setTimeout(() => done(false), timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", onChange, { once: true });
  });
}

function handshakeController(timeoutMs: number): Promise<"PASS" | "FAIL_IDENTITY_MISMATCH" | "FAIL_TIMEOUT"> {
  return new Promise((resolve) => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      resolve("FAIL_TIMEOUT");
      return;
    }

    const nonce = crypto.randomUUID();
    const channel = new MessageChannel();
    let settled = false;

    const finish = (value: "PASS" | "FAIL_IDENTITY_MISMATCH" | "FAIL_TIMEOUT") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.port1.close();
      resolve(value);
    };

    const timer = window.setTimeout(() => finish("FAIL_TIMEOUT"), timeoutMs);
    channel.port1.onmessage = (event) => {
      const msg = event.data as Record<string, unknown> | null;
      if (
        msg &&
        msg.type === "ODI_OPERATOR_SW_HANDSHAKE_ACK" &&
        msg.identity === SW_IDENTITY &&
        msg.nonce === nonce
      ) {
        finish("PASS");
      } else {
        finish("FAIL_IDENTITY_MISMATCH");
      }
    };

    controller.postMessage(
      { type: "ODI_OPERATOR_SW_HANDSHAKE", identity: SW_IDENTITY, nonce },
      [channel.port2]
    );
  });
}

export default function OperatorGrant() {
  const [auth, setAuth] = useState<AuthState>("CHECKING");
  const [sw, setSw] = useState<SwState>("CHECKING");
  const [presented, setPresented] = useState<PresentedGrant | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const clearPresented = useCallback(() => setPresented(null), []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);

    (async () => {
      try {
        const token = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!token) {
          setAuth("FAIL");
          return;
        }
        const response = await fetch(AUTH_VALIDATE_URL, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
        });
        setAuth(response.ok ? "PASS" : "FAIL");
      } catch {
        setAuth("FAIL");
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (auth !== "PASS") return;

    let cancelled = false;

    (async () => {
      if (!("serviceWorker" in navigator)) {
        if (!cancelled) setSw("FAIL_NO_CONTROLLER");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration) {
          if (!cancelled) setSw("FAIL_NO_CONTROLLER");
          return;
        }

        await registration.update();

        if (!navigator.serviceWorker.controller) {
          if (!cancelled) setSw("WAITING_CONTROLLERCHANGE");
          const changed = await waitForControllerChange(SW_TIMEOUT_MS);
          if (!changed || !navigator.serviceWorker.controller) {
            if (!cancelled) setSw("FAIL_NO_CONTROLLER");
            return;
          }
        }

        const result = await handshakeController(SW_TIMEOUT_MS);
        if (!cancelled) setSw(result);
      } catch {
        if (!cancelled) setSw("FAIL_TIMEOUT");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth]);

  useEffect(() => {
    if (!presented) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [presented]);

  const secondsLeft = useMemo(() => {
    if (!presented) return 0;
    return Math.max(0, Math.ceil((presented.expiresAtMs - nowMs) / 1000));
  }, [presented, nowMs]);

  useEffect(() => {
    if (presented && secondsLeft <= 0) clearPresented();
  }, [presented, secondsLeft, clearPresented]);

  const runLocalRehearsal = () => {
    if (auth !== "PASS" || sw !== "PASS") return;

    const fixture = {
      ok: true,
      grant_id: "LOCAL_IN_MEMORY_REHEARSAL",
      pairing_secret: makeBase64Url43(),
      expires_at: new Date(Date.now() + REHEARSAL_TTL_SECONDS * 1000).toISOString(),
    };

    const parsed = parseGrantEnvelope(fixture);
    if (!parsed) {
      clearPresented();
      return;
    }

    setNowMs(Date.now());
    setPresented({
      grantId: parsed.grantId,
      value: parsed.value,
      expiresAtMs: parsed.expiresAtMs,
      provenance: "LOCAL_IN_MEMORY_REHEARSAL",
    });
  };

  if (auth === "CHECKING") {
    return <main style={styles.shell}><section style={styles.card}>Validando sesión…</section></main>;
  }

  if (auth !== "PASS") {
    return (
      <main style={styles.shell}>
        <section style={styles.card}>
          <h1 style={styles.title}>Operador ODI</h1>
          <p style={styles.danger}>Acceso no autorizado.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <div style={styles.banner}>ENSAYO · NO EMITE CONCESIONES</div>
        <h1 style={styles.title}>Operador de vinculación 0.1.3</h1>
        <p style={styles.muted}>
          Stage A · CALIBRATION_LOCKED. La capacidad de emisión real no existe en este despliegue.
        </p>

        <div style={styles.grid}>
          <div style={styles.statusBox}>
            <strong>SW CONTROLLER</strong>
            <span style={sw === "PASS" ? styles.pass : styles.warn}>{sw}</span>
          </div>
          <div style={styles.statusBox}>
            <strong>CALIBRACIÓN</strong>
            <span style={styles.warn}>NOT_CALIBRATED</span>
          </div>
        </div>

        <hr style={styles.hr} />

        <h2 style={styles.h2}>Rehearsal local</h2>
        <p style={styles.muted}>
          Genera un valor NONSECRET de 43 caracteres únicamente en memoria. Este camino no llama
          a <code>/api/operator-grant</code> ni a ningún endpoint de pairing.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={runLocalRehearsal}
            disabled={sw !== "PASS"}
            style={{ ...styles.button, ...(sw !== "PASS" ? styles.buttonDisabled : {}) }}
          >
            Generar ensayo local
          </button>
          <button
            type="button"
            onClick={clearPresented}
            disabled={!presented}
            style={{ ...styles.secondaryButton, ...(!presented ? styles.buttonDisabled : {}) }}
          >
            Limpiar
          </button>
        </div>

        {presented && (
          <div style={styles.secretBox}>
            <div style={styles.small}>PROVENANCE · {presented.provenance}</div>
            <div style={styles.secret}>{presented.value}</div>
            <div style={styles.small}>Ventana simulada restante: {secondsLeft}s</div>
            <p style={styles.muted}>
              Para el dry-run autorizado posteriormente, este valor se transcribe manualmente al
              CredUI nativo. No es una concesión real.
            </p>
          </div>
        )}

        <div style={styles.lockBox}>
          <strong>LIVE ISSUANCE</strong>
          <span style={styles.danger}>AUSENTE · OPERATOR_NOT_CALIBRATED</span>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: "#020509",
    color: "#eaf4ff",
    display: "flex",
    justifyContent: "center",
    padding: "48px 20px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  card: {
    width: "min(760px, 100%)",
    background: "#07111d",
    border: "1px solid #17324a",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 24px 70px rgba(0,0,0,.35)",
  },
  banner: {
    border: "1px solid #6d5c18",
    background: "#211d08",
    color: "#ffe67a",
    borderRadius: 10,
    padding: "10px 12px",
    fontWeight: 800,
    letterSpacing: ".04em",
    marginBottom: 20,
  },
  title: { margin: 0, fontSize: 28 },
  h2: { fontSize: 18, marginTop: 0 },
  muted: { color: "#a8bed0", lineHeight: 1.55 },
  danger: { color: "#ff8f8f", fontWeight: 700 },
  pass: { color: "#8dffb2", fontWeight: 800 },
  warn: { color: "#ffe67a", fontWeight: 800 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 20,
  },
  statusBox: {
    border: "1px solid #17324a",
    background: "#050c14",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  hr: { border: 0, borderTop: "1px solid #17324a", margin: "24px 0" },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  button: {
    border: 0,
    borderRadius: 10,
    padding: "11px 15px",
    background: "#2d9cff",
    color: "#02101d",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #31536c",
    borderRadius: 10,
    padding: "11px 15px",
    background: "#0a1723",
    color: "#d9ecfb",
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.45, cursor: "not-allowed" },
  secretBox: {
    marginTop: 18,
    border: "1px solid #255276",
    borderRadius: 12,
    background: "#04101a",
    padding: 16,
  },
  secret: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 18,
    letterSpacing: ".04em",
    overflowWrap: "anywhere",
    margin: "10px 0",
  },
  small: { color: "#7f9db3", fontSize: 12 },
  lockBox: {
    marginTop: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    borderTop: "1px solid #17324a",
    paddingTop: 18,
    flexWrap: "wrap",
  },
};
