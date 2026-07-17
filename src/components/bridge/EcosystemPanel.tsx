// Bloque 2 · Puesto de mando · panel de lectura del ecosistema. RC-B2.1.
// Aislado del componente crítico de conversación. 4 secciones con degradación independiente.
// Responsive: split desktop · drawer tablet · full-view móvil. Secciones colapsables.
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPanelRead, type PanelFetchState, type Section } from "../../lib/ecosystemRead";

interface Props {
	open: boolean;
	bearer: string | null;
	onClose: () => void;
}

const REFRESH_MS = 60_000;

export type ViewMode = "desktop" | "tablet" | "mobile";
export function useViewMode(): ViewMode {
	const [m, setM] = useState<ViewMode>(() =>
		typeof window === "undefined" ? "desktop"
			: window.innerWidth >= 1024 ? "desktop" : window.innerWidth >= 768 ? "tablet" : "mobile");
	useEffect(() => {
		const on = () => setM(window.innerWidth >= 1024 ? "desktop" : window.innerWidth >= 768 ? "tablet" : "mobile");
		window.addEventListener("resize", on);
		return () => window.removeEventListener("resize", on);
	}, []);
	return m;
}

function SectionShell({ title, s, children }: { title: string; s: Section<unknown>; children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(false);   // secciones colapsables (firmado)
	return (
		<div style={{ background: "#0f1622", border: "1px solid #1e2b3d", borderRadius: 12, padding: 14, marginBottom: 12 }}>
			<button onClick={() => setCollapsed((v) => !v)}
				style={{ all: "unset", cursor: "pointer", display: "flex", justifyContent: "space-between",
					alignItems: "center", width: "100%", marginBottom: collapsed ? 0 : 8 }}>
				<span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#7fa8d4" }}>
					{collapsed ? "▸" : "▾"} {title}
				</span>
				<span style={{ fontSize: 10, color: s.status === "ok" ? "#3ecf8e" : "#d4a13e" }}>
					{s.status === "ok" ? "● live" : "● no disp."}
				</span>
			</button>
			{!collapsed && (s.status === "ok"
				? children
				: <div style={{ fontSize: 12, color: "#6a819c" }}>Fuente temporalmente no disponible</div>)}
		</div>
	);
}

export default function EcosystemPanel({ open, bearer, onClose }: Props) {
	const [state, setState] = useState<PanelFetchState>({ status: "loading" });
	const timerRef = useRef<number | null>(null);
	const inFlight = useRef(false);
	const mode = useViewMode();

	const load = useCallback(async () => {
		if (inFlight.current) return;
		inFlight.current = true;
		setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
		const next = await fetchPanelRead(bearer);
		setState(next);
		inFlight.current = false;
	}, [bearer]);

	useEffect(() => {
		if (!open) return;
		load();
		const tick = () => {
			if (!document.hidden) load();
			timerRef.current = window.setTimeout(tick, REFRESH_MS);
		};
		timerRef.current = window.setTimeout(tick, REFRESH_MS);
		return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
	}, [open, load]);

	if (!open) return null;

	// Ancho responsive: móvil = full-view · tablet/desktop = columna lateral.
	const width = mode === "mobile" ? "100vw" : mode === "tablet" ? "min(380px, 92vw)" : 380;
	const style: React.CSSProperties = {
		height: "100%", width, overflowY: "auto", padding: 16,
		background: "#0a0f18", borderLeft: mode === "mobile" ? "none" : "1px solid #1e2b3d",
		boxSizing: "border-box",
	};

	const body = () => {
		if (!bearer || state.status === "unauthorized")
			return <Msg color="#a9c0dc">Identifícate para abrir el puesto de mando.</Msg>;
		if (state.status === "forbidden")
			return <Msg color="#d4a13e">Tu sesión no tiene autoridad sobre el puesto de mando.</Msg>;
		return (
			<>
				{state.status === "error" && <Msg color="#d4a13e">Reconectando con el estado del ecosistema…</Msg>}
				{state.status === "ready" && (
					<>
						<SectionShell title="Dispatch" s={state.data.sections.dispatch}>
							{state.data.sections.dispatch.data && (
								<>
									<div style={rowStyle}>
										<Stat label="pendientes" v={state.data.sections.dispatch.data.counts.pending} />
										<Stat label="en curso" v={state.data.sections.dispatch.data.counts.running} />
										<Stat label="hechas" v={state.data.sections.dispatch.data.counts.done} />
										<Stat label="atención" v={state.data.sections.dispatch.data.attention ? "sí" : "no"} />
									</div>
									<div style={{ ...rowStyle, marginTop: 8 }}>
										<Stat label="done total" v={state.data.sections.dispatch.data.metricas.done_total} />
										<Stat label="c/evidencia" v={state.data.sections.dispatch.data.metricas.done_con_evidencia} />
										<Stat label="escaladas" v={state.data.sections.dispatch.data.metricas.escaladas} />
									</div>
								</>
							)}
						</SectionShell>

						<SectionShell title="Tiendas SRM" s={state.data.sections.tiendas}>
							{state.data.sections.tiendas.data && (
								<>
									<div style={rowStyle}><Stat label="tiendas" v={state.data.sections.tiendas.data.total} /></div>
									<div style={{ marginTop: 8, maxHeight: mode === "mobile" ? 260 : 140, overflowY: "auto" }}>
										{state.data.sections.tiendas.data.stores.slice(0, 20).map((st) => (
											<div key={st.store} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#c3d4e8" }}>
												<span>{st.store}</span>
												<span style={{ color: "#7fa8d4" }}>{st.grade ?? "—"} · {st.products} prod</span>
											</div>
										))}
									</div>
								</>
							)}
						</SectionShell>

						<SectionShell title="ChromaDB" s={state.data.sections.chromadb}>
							{state.data.sections.chromadb.data && (
								<div style={rowStyle}>
									<Stat label="colecciones" v={state.data.sections.chromadb.data.colecciones} />
									<Stat label="documentos" v={state.data.sections.chromadb.data.documentos} />
								</div>
							)}
						</SectionShell>

						<SectionShell title="Billing" s={state.data.sections.billing}>
							{state.data.sections.billing.data && (
								<div style={rowStyle}><Stat label="estado" v={state.data.sections.billing.data.estado ?? "—"} /></div>
							)}
						</SectionShell>
					</>
				)}
			</>
		);
	};

	return (
		<div style={style}>
			<Header onRefresh={load} onClose={onClose} loading={state.status === "loading"} />
			{body()}
		</div>
	);
}

function Msg({ color, children }: { color: string; children: React.ReactNode }) {
	return <div style={{ color, fontSize: 13, padding: 20, textAlign: "center" }}>{children}</div>;
}
function Header({ onRefresh, onClose, loading }: { onRefresh: () => void; onClose: () => void; loading?: boolean }) {
	return (
		<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
			<span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#9db8d8" }}>
				ODI → Estado del ecosistema
			</span>
			<span>
				<button onClick={onRefresh} disabled={loading} style={btnStyle} aria-label="Refrescar">{loading ? "…" : "↻"}</button>
				<button onClick={onClose} style={btnStyle} aria-label="Cerrar">✕</button>
			</span>
		</div>
	);
}
function Stat({ label, v }: { label: string; v: number | string }) {
	return (
		<div style={{ textAlign: "center", flex: 1 }}>
			<div style={{ fontSize: 18, fontWeight: 600, color: "#e6eef8" }}>{v}</div>
			<div style={{ fontSize: 10, color: "#6a819c", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
		</div>
	);
}
const rowStyle: React.CSSProperties = { display: "flex", gap: 10 };
const btnStyle: React.CSSProperties = {
	background: "transparent", border: "1px solid #2a3b52", color: "#9db8d8",
	borderRadius: 8, cursor: "pointer", fontSize: 13, padding: "3px 9px", marginLeft: 6,
};
