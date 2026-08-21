import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CircleDollarSign,
  Eye,
  Gauge,
  HeartPulse,
  Laptop,
  RefreshCw,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import {
  PmcApiError,
  pmcApi,
  type PmcBillingSignal,
  type PmcHealingStatus,
  type PmcReadModel,
} from "@/lib/odiApi";

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; data: PmcReadModel }
  | { kind: "auth_required" }
  | { kind: "forbidden" }
  | { kind: "unavailable" }
  | { kind: "error"; message: string };

type BillingState =
  | { kind: "loading" }
  | { kind: "ready"; data: PmcBillingSignal }
  | { kind: "degraded"; message: string };

type HealingState =
  | { kind: "loading" }
  | { kind: "ready"; data: PmcHealingStatus }
  | { kind: "degraded"; message: string };

const C = {
  bg: "#020509",
  surface: "#07111e",
  surface2: "#0b1625",
  border: "#17304f",
  text: "#d8e8ff",
  soft: "#8ba3c4",
  dim: "#587494",
  green: "#2ef08a",
  amber: "#ffb454",
  red: "#ff6b78",
  blue: "#49c2ff",
};

function displayScalar(value: unknown): string {
  if (value === null || value === undefined) return "No medido";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function displayTimestamp(value: unknown): string {
  if (value === null || value === undefined || value === "") return "No medido";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString("es-CO");
}

function overallMeta(value: unknown) {
  const estado = String(value ?? "no_medible").toLowerCase();
  if (estado === "ok") return { label: "Operativo", color: C.green };
  if (estado === "parcial") return { label: "Parcial", color: C.amber };
  return { label: "No medible", color: C.dim };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail?: string;
}) {
  const unknown = value === "No medido";
  return (
    <article
      style={{
        minHeight: 142,
        padding: 18,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.surface,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.soft }}>
        <Icon size={17} aria-hidden="true" />
        <span style={{ fontSize: 12, letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <div>
        <div
          style={{
            color: unknown ? C.dim : C.text,
            fontSize: unknown ? 20 : 30,
            fontWeight: 650,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </div>
        {detail ? <div style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>{detail}</div> : null}
      </div>
    </article>
  );
}

function ReadOnlyNotice() {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        background: C.surface,
        borderRadius: 14,
        padding: "13px 15px",
        color: C.soft,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <strong style={{ color: C.blue }}>Observación solamente.</strong> El Puesto consume K0
      <code style={{ marginLeft: 5 }}>pmc.read_model.v1</code> como columna vertebral y señales secundarias
      allowlisted/read-only cuando ya existen. No emite STOP, directivas, grants ni otras mutaciones.
    </div>
  );
}

export default function PMC() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [billingState, setBillingState] = useState<BillingState>({ kind: "loading" });
  const [healingState, setHealingState] = useState<HealingState>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setState({ kind: "loading" });
    setBillingState({ kind: "loading" });
    setHealingState({ kind: "loading" });

    try {
      const data = await pmcApi.readModel();
      setState({ kind: "ready", data });

      const [billingResult, healingResult] = await Promise.allSettled([
        pmcApi.billingSignal(),
        pmcApi.healingSignal(),
      ]);

      if (billingResult.status === "fulfilled") {
        setBillingState({ kind: "ready", data: billingResult.value });
      } else {
        const message = billingResult.reason instanceof Error ? billingResult.reason.message : "Billing no medible.";
        setBillingState({ kind: "degraded", message });
      }

      if (healingResult.status === "fulfilled") {
        setHealingState({ kind: "ready", data: healingResult.value });
      } else {
        const message = healingResult.reason instanceof Error ? healingResult.reason.message : "Self-Healing no medible.";
        setHealingState({ kind: "degraded", message });
      }
    } catch (error) {
      const message = "No consultado: K0 no quedó disponible.";
      setBillingState({ kind: "degraded", message });
      setHealingState({ kind: "degraded", message });
      if (error instanceof PmcApiError) {
        if (error.code === "AUTH_REQUIRED") setState({ kind: "auth_required" });
        else if (error.code === "FORBIDDEN") setState({ kind: "forbidden" });
        else if (error.code === "UNAVAILABLE") setState({ kind: "unavailable" });
        else setState({ kind: "error", message: error.message });
      } else {
        setState({ kind: "error", message: "No fue posible leer el estado del Puesto de Mando." });
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const data = state.kind === "ready" ? state.data : null;
  const canal = data?.sections?.canal?.data;
  const operador = data?.sections?.operador?.data;
  const billing = billingState.kind === "ready" ? billingState.data : null;
  const healing = healingState.kind === "ready" ? healingState.data : null;
  const meta = useMemo(() => overallMeta(data?.overall?.estado), [data?.overall?.estado]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "32px 20px 56px",
      }}
    >
      <div style={{ width: "min(1180px, 100%)", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: C.blue, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Industrias ODI · Centro de Mando
            </div>
            <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(28px, 5vw, 48px)", letterSpacing: "-0.045em" }}>
              Puesto de Mando
            </h1>
            <p style={{ margin: 0, color: C.soft, maxWidth: 660, lineHeight: 1.6 }}>
              Estado vivo del canal, operador y primeras señales del organismo. Los vacíos permanecen visibles como
              “No medido”; nunca se convierten en ceros inventados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing || state.kind === "loading"}
            style={{
              border: `1px solid ${C.border}`,
              background: C.surface2,
              color: C.text,
              borderRadius: 12,
              padding: "10px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: refreshing ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {refreshing ? "Actualizando…" : "Actualizar"}
          </button>
        </header>

        <ReadOnlyNotice />

        {state.kind === "loading" ? (
          <section style={{ marginTop: 24, color: C.soft }}>Leyendo K0…</section>
        ) : null}

        {state.kind === "auth_required" ? (
          <section style={{ marginTop: 24, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, background: C.surface }}>
            <ShieldCheck size={22} color={C.amber} aria-hidden="true" />
            <h2 style={{ margin: "12px 0 6px" }}>Sesión ODI requerida</h2>
            <p style={{ color: C.soft, margin: 0, lineHeight: 1.6 }}>
              No hay una sesión ODI disponible en este navegador. Inicia sesión en LiveODI con una identidad autorizada y vuelve a esta ruta.
            </p>
            <a href="/agent" style={{ display: "inline-block", marginTop: 14, color: C.blue }}>
              Ir a LiveODI
            </a>
          </section>
        ) : null}

        {state.kind === "forbidden" ? (
          <section style={{ marginTop: 24, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, background: C.surface }}>
            <AlertTriangle size={22} color={C.amber} aria-hidden="true" />
            <h2 style={{ margin: "12px 0 6px" }}>Sesión válida sin autoridad PMC</h2>
            <p style={{ color: C.soft, margin: 0, lineHeight: 1.6 }}>
              El backend rechazó la lectura por autoridad. La interfaz no intenta elevar privilegios ni usar atajos alternos.
            </p>
          </section>
        ) : null}

        {state.kind === "unavailable" ? (
          <section style={{ marginTop: 24, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, background: C.surface }}>
            <AlertTriangle size={22} color={C.red} aria-hidden="true" />
            <h2 style={{ margin: "12px 0 6px" }}>K0 no disponible</h2>
            <p style={{ color: C.soft, margin: 0, lineHeight: 1.6 }}>
              El Puesto de Mando no fabricará un estado alternativo. Reintenta cuando el contrato vuelva a estar disponible.
            </p>
          </section>
        ) : null}

        {state.kind === "error" ? (
          <section style={{ marginTop: 24, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, background: C.surface }}>
            <AlertTriangle size={22} color={C.red} aria-hidden="true" />
            <h2 style={{ margin: "12px 0 6px" }}>Lectura degradada</h2>
            <p style={{ color: C.soft, margin: 0, lineHeight: 1.6 }}>{state.message}</p>
          </section>
        ) : null}

        {data ? (
          <>
            <section
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 18,
                background: C.surface,
                border: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Estado general</div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color }} />
                  <strong style={{ fontSize: 23 }}>{meta.label}</strong>
                </div>
              </div>
              <div style={{ color: C.soft, fontSize: 12, lineHeight: 1.7 }}>
                Medidas: {displayScalar(data.overall?.secciones_medidas)} · Degradadas: {displayScalar(data.overall?.secciones_degradadas)} · No aplicables: {displayScalar(data.overall?.secciones_no_aplicables)}
              </div>
            </section>

            <section
              aria-label="Canal Ojo"
              style={{
                marginTop: 26,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 12,
              }}
            >
              <MetricCard icon={Laptop} label="Dispositivos registrados" value={displayScalar(canal?.dispositivos)} />
              <MetricCard
                icon={Activity}
                label="Dispositivos en estado activo (declarado)"
                value={displayScalar(canal?.dispositivos_activos)}
                detail="No equivale a online ahora"
              />
              <MetricCard icon={Gauge} label="En hold de captura" value={displayScalar(canal?.en_hold_de_captura)} />
              <MetricCard icon={Eye} label="Sesiones de Ojo activas" value={displayScalar(canal?.sesiones_ojo_activas)} />
              <MetricCard icon={TimerReset} label="Último latido" value={displayTimestamp(canal?.ultimo_latido)} detail="Frescura separada del estado declarado" />
            </section>

            <section
              aria-label="Señales del organismo"
              style={{
                marginTop: 26,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              <article style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, background: C.surface }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, color: C.soft }}>
                  <CircleDollarSign size={17} aria-hidden="true" />
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Billing</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 20, fontWeight: 650 }}>
                  {billingState.kind === "loading" ? "Midiendo…" : displayScalar(billing?.estado)}
                </div>
                <div style={{ color: C.soft, marginTop: 8, fontSize: 12 }}>
                  Contrato: {billing?.contract ?? "bridge-panel-read.v1"} · Estado sección: {displayScalar(billing?.status)}
                </div>
                <div style={{ color: billingState.kind === "degraded" ? C.amber : C.dim, marginTop: 8, fontSize: 11 }}>
                  {billingState.kind === "degraded"
                    ? `Degradado: ${billingState.message}`
                    : `Observado: ${displayTimestamp(billing?.generated_at)} · DTO sin montos/PII`}
                </div>
              </article>

              <article style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, background: C.surface }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, color: C.soft }}>
                  <HeartPulse size={17} aria-hidden="true" />
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Self-Healing</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 20, fontWeight: 650 }}>
                  {healingState.kind === "loading" ? "Midiendo…" : displayScalar(healing?.mode_default)}
                </div>
                <div style={{ color: C.soft, marginTop: 8, fontSize: 12 }}>
                  Contrato: {healing?.version ?? "healing_status.v1"} · Criterios: {displayScalar(healing?.criteria_count)} · Acciones: {displayScalar(healing?.actions_canonical_count)}
                </div>
                <div style={{ color: healingState.kind === "degraded" ? C.amber : C.dim, marginTop: 8, fontSize: 11 }}>
                  {healingState.kind === "degraded"
                    ? `Degradado: ${healingState.message}`
                    : `Evaluados: ${displayScalar(healing?.stats?.evaluated)} · disparos: ${displayScalar(healing?.stats?.criteria_triggered)} · errores: ${displayScalar(healing?.stats?.errors)} · sólo estado, no ejecuta heal_store`}
                </div>
              </article>
            </section>

            <section
              style={{
                marginTop: 26,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              <article style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, background: C.surface }}>
                <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Operador</div>
                <div style={{ marginTop: 12, fontSize: 20, fontWeight: 650 }}>{displayScalar(operador?.estado)}</div>
                <div style={{ color: C.soft, marginTop: 8, fontSize: 12 }}>
                  Activo: {displayScalar(operador?.activo)} · Autoridad reportada: {displayScalar(operador?.authority_level)}
                </div>
                <div style={{ color: C.dim, marginTop: 8, fontSize: 11 }}>
                  Observado: {displayTimestamp(data.sections?.operador?.observed_at)}
                </div>
              </article>
              <article style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, background: C.surface }}>
                <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Canal</div>
                <div style={{ marginTop: 12, fontSize: 20, fontWeight: 650 }}>{displayScalar(data.sections?.canal?.status)}</div>
                <div style={{ color: C.soft, marginTop: 8, fontSize: 12 }}>
                  Fuente: {displayScalar(data.sections?.canal?.source)}
                </div>
                <div style={{ color: C.dim, marginTop: 8, fontSize: 11 }}>
                  Observado: {displayTimestamp(data.sections?.canal?.observed_at)}
                </div>
              </article>
            </section>
          </>
        ) : null}

        <footer style={{ marginTop: 34, color: C.dim, fontSize: 11, lineHeight: 1.7 }}>
          F1A · K0 + señales read-only reutilizadas · Sin controles mutativos · Los campos no medidos permanecen explícitos.
        </footer>
      </div>
    </main>
  );
}
