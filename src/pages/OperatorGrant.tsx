import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";

const AUTH_STORAGE_KEY = "odi_session";
const AUTH_VALIDATE_URL = "https://api.liveodi.com/auth/validate";
const SW_IDENTITY = "ODI_OPERATOR_SW_SAFE_R1";
const SW_TIMEOUT_MS = 5000;
const FROZEN_TTL_SECONDS = 120;

type SwState =
  | "CHECKING"
  | "PASS"
  | "FAIL_NO_CONTROLLER"
  | "FAIL_IDENTITY_MISMATCH"
  | "FAIL_TIMEOUT"
  | "WAITING_CONTROLLERCHANGE";

type AuthState = "CHECKING" | "PASS" | "FAIL";
type IssueState = "IDLE" | "REQUESTING" | "PASS" | "FAIL";

type PresentedGrant = {
  grantId: string;
  value: string;
  expiresAt: string;
  retentionSeconds: number;
  provenance: "LIVE_OPERATOR_GRANT";
};

function parseGrantEnvelope(
  input: unknown,
): { grantId: string; value: string; expiresAt: string; retentionSeconds: number } | null {
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
  if (x.credential_type !== "OPAQUE_BEARER_V1") return null;
  if (typeof x.expires_at !== "string" || !Number.isFinite(Date.parse(x.expires_at))) {
    return null;
  }

  const ttl = x.expires_in_seconds;
  const retentionSeconds =
    typeof ttl === "number" && Number.isInteger(ttl) && ttl > 0
      ? Math.min(ttl, FROZEN_TTL_SECONDS)
      : FROZEN_TTL_SECONDS;

  return {
    grantId: x.grant_id,
    value: x.pairing_secret,
    expiresAt: x.expires_at,
    retentionSeconds,
  };
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

function handshakeController(
  timeoutMs: number,
): Promise<"PASS" | "FAIL_IDENTITY_MISMATCH" | "FAIL_TIMEOUT"> {
  return new Promise((resolve) => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      resolve("FAIL_TIMEOUT");
      return;
    }

    const nonce = crypto.randomUUID();
    const channel = new MessageChannel();
    let settled = false;

    const finish = (
      value: "PASS" | "FAIL_IDENTITY_MISMATCH" | "FAIL_TIMEOUT",
    ) => {
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
      [channel.port2],
    );
  });
}

function readErrorCode(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Record<string, unknown>;
  return typeof x.error === "string" ? x.error : null;
}

export default function OperatorGrant() {
  const [auth, setAuth] = useState<AuthState>("CHECKING");
  const [sw, setSw] = useState<SwState>("CHECKING");
  const [issue, setIssue] = useState<IssueState>("IDLE");
  const [issueError, setIssueError] = useState<string | null>(null);
  const [hasDispatched, setHasDispatched] = useState(false);
  const [presented, setPresented] = useState<PresentedGrant | null>(null);

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

  // Memory-hygiene timer only. It never decides grant validity and never blocks
  // initial presentation. The server remains the sole expiry authority.
  useEffect(() => {
    if (!presented) return;
    const timer = window.setTimeout(clearPresented, presented.retentionSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [presented, clearPresented]);

  const issueLiveGrant = async () => {
    if (
      auth !== "PASS" ||
      sw !== "PASS" ||
      issue === "REQUESTING" ||
      hasDispatched
    ) {
      return;
    }

    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
      setAuth("FAIL");
      return;
    }

    setIssue("REQUESTING");
    setIssueError(null);
    clearPresented();
    setHasDispatched(true);

    try {
      const response = await fetch("/api/operator-grant", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setIssue("FAIL");
        setIssueError(readErrorCode(payload) ?? `HTTP_${response.status}`);
        return;
      }

      const parsed = parseGrantEnvelope(payload);
      if (!parsed) {
        // A mint may already have committed. Never reopen the button on this page.
        setIssue("FAIL");
        setIssueError("INVALID_GRANT_ENVELOPE_MINT_STATE_UNKNOWN");
        return;
      }

      setPresented({
        grantId: parsed.grantId,
        value: parsed.value,
        expiresAt: parsed.expiresAt,
        retentionSeconds: parsed.retentionSeconds,
        provenance: "LIVE_OPERATOR_GRANT",
      });
      setIssue("PASS");
    } catch {
      // The facade may have attempted the upstream mint. Never retry automatically.
      setIssue("FAIL");
      setIssueError("ISSUANCE_REQUEST_STATE_UNKNOWN");
    }
  };

  if (auth === "CHECKING") {
    return (
      <main style={styles.shell}>
        <section style={styles.card}>Validando sesión...</section>
      </main>
    );
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

  const canIssue = sw === "PASS" && issue !== "REQUESTING" && !hasDispatched;

  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <div style={styles.banner}>HUMAN-GATED · ONE-SHOT</div>
        <h1 style={styles.title}>Operador de vinculacion</h1>
        <p style={styles.muted}>
          Primero inicia Vincular en el Bridge y confirma visualmente que el CredUI
          nativo ya esta abierto y esperando entrada. Solo despues vuelve aqui y emite
          la concesion. El navegador no decide device, audience, execution key ni expiry.
        </p>

        <div style={styles.grid}>
          <div style={styles.statusBox}>
            <strong>SW INTEGRITY GATE</strong>
            <span style={sw === "PASS" ? styles.pass : styles.warn}>{sw}</span>
          </div>
          <div style={styles.statusBox}>
            <strong>READINESS AUTHORITY</strong>
            <span style={styles.pass}>HUMAN VISUAL CONFIRMATION</span>
          </div>
        </div>

        <hr style={styles.hr} />

        <h2 style={styles.h2}>Concesion real</h2>
        <p style={styles.muted}>
          Este boton despacha como maximo una solicitud desde esta carga de pagina.
          No existe reintento automatico ni rechazo post-mint por reloj local.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={issueLiveGrant}
            disabled={!canIssue}
            style={{ ...styles.button, ...(!canIssue ? styles.buttonDisabled : {}) }}
          >
            {issue === "REQUESTING" ? "Emitiendo..." : "Ya veo CredUI - Emitir concesion"}
          </button>
          <button
            type="button"
            onClick={clearPresented}
            disabled={!presented}
            style={{
              ...styles.secondaryButton,
              ...(!presented ? styles.buttonDisabled : {}),
            }}
          >
            Limpiar secreto de pantalla
          </button>
        </div>

        {issue === "FAIL" && issueError && (
          <div style={styles.errorBox}>
            <strong>EMISION NO UTILIZABLE</strong>
            <span style={styles.danger}>{issueError}</span>
            <div style={styles.small}>NO RETRY AUTOMATICO · NO SEGUNDO CLICK</div>
          </div>
        )}

        {presented && (
          <div style={styles.secretBox}>
            <div style={styles.small}>PROVENANCE · {presented.provenance}</div>
            <div style={styles.small}>GRANT ID · {presented.grantId}</div>
            <div style={styles.secret}>{presented.value}</div>
            <div style={styles.small}>EXPIRA SEGUN POSTGRESQL · {presented.expiresAt}</div>
            <p style={styles.muted}>
              Presentacion inmediata. Transcribe manualmente grant ID y secreto al CredUI
              nativo ya abierto. La limpieza local es solo higiene de memoria y no decide
              la validez del grant.
            </p>
          </div>
        )}

        <div style={styles.lockBox}>
          <strong>LIVE ISSUANCE</strong>
          <span style={styles.pass}>HUMAN CLICK · ONE-SHOT PER PAGE LOAD</span>
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
    border: "1px solid #255276",
    background: "#071a2a",
    color: "#8dffb2",
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
  errorBox: {
    marginTop: 18,
    border: "1px solid #6b2b2b",
    borderRadius: 12,
    background: "#1a0808",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
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
