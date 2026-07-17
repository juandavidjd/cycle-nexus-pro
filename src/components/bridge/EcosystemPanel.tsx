// Bloque 2 · Puesto de mando · panel de lectura del ecosistema.
// Aislado del componente crítico de conversación: toda la lógica de fetch/estado vive aquí.
// Muestra 4 secciones (dispatch · tiendas · chromadb · billing), cada una degradando por su cuenta.
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPanelRead, type PanelFetchState, type Section } from "../../lib/ecosystemRead";

interface Props {
	open: boolean;
	bearer: string | null;
	onClose: () => void;
}

const REFRESH_MS = 60_000;

function SectionShell({ title, s, children }: { title: string; s: Section<unknown>; children: React.ReactNode }) {
	return (
		<div style={{ background: "#0f1622", border: "1px solid #1e2b3d", borderRadius: 12, padding: 14, marginBottom: 12 }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
				<span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#7fa8d4" }}>{title}</span>
				<span style={{ fontSize: 10, color: s.status === "ok" ? "#3ecf8e" : "#d4a13e" }}>
					{s.status === "ok" ? "● live" : "● no disponible"}
				</span>
			</div>
			{s.status === "ok" ? children : (
				<div style={{ fontSize: 12, color: "#6a819c" }}>Fuente temporalmente no disponible</div>
			)}
		</div>
	);
}

export default function EcosystemPanel({ open, bearer, onClose }: Props) {
	const [state, setState] = useState<PanelFetchState>({ status: "loading" });
	const timerRef = useRef<number | null>(null);
	const inFlight = useRef(false);

	const load = useCallback(async () => {
		if (inFlight.current) return;         // sin solicitudes solapadas
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
			// timer suave SOLO con panel abierto y documento visible
			if (!document.hidden) load();
			timerRef.current = window.setTimeout(tick, REFRESH_MS);
		};
		timerRef.current = window.setTimeout(tick, REFRESH_MS);
		return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
	}, [open, load]);

	if (!open) return null;

	if (!bearer || state.status === "unauthorized") {
		return (
			<div style={panelStyle}>
				<Header onRefresh={load} onClose={onClose} />
				<div style={{ color: "#a9c0dc", fontSize: 13, padding: 20, textAlign: "center" }}>
					Identifícate para abrir el puesto de mando.
				</div>
			</div>
		);
	}
	if (state.status === "forbidden") {
		return (
			<div style={panelStyle}>
				<Header onRefresh={load} onClose={onClose} />
				<div style={{ color: "#d4a13e", fontSize: 13, padding: 20, textAlign: "center" }}>
					Tu sesión no tiene autoridad sobre el puesto de mando.
				</div>
			</div>
		);
	}

	return (
		<div style={panelStyle}>
			<Header onRefresh={load} onClose={onClose} loading={state.status === "loading"} />
			{state.status === "error" && (
				<div style={{ color: "#d4a13e", fontSize: 12, marginBottom: 10 }}>
					Reconectando con el estado del ecosistema…
				</div>
			)}
			{state.status === "ready" && (
				<>
					<SectionShell title="Dispatch" s={state.data.sections.dispatch}>
						{state.data.sections.dispatch.data && (
							<div style={rowStyle}>
								<Stat label="pendientes" v={state.data.sections.dispatch.data.counts.pending} />
								<Stat label="en curso" v={state.data.sections.dispatch.data.counts.running} />
								<Stat label="hechas" v={state.data.sections.dispatch.data.counts.done} />
								<Stat label="atención" v={state.data.sections.dispatch.data.attention ? "sí" : "no"} />
							</div>
						)}
					</SectionShell>

					<SectionShell title="Tiendas SRM" s={state.data.sections.tiendas}>
						{state.data.sections.tiendas.data && (
							<>
								<div style={rowStyle}>
									<Stat label="tiendas" v={state.data.sections.tiendas.data.total} />
									<Stat label="con catálogo" v={state.data.sections.tiendas.data.con_catalogo} />
								</div>
								<div style={{ marginTop: 8, maxHeight: 140, overflowY: "auto" }}>
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
							<div style={rowStyle}>
								<Stat label="estado" v={state.data.sections.billing.data.estado ?? "—"} />
								<Stat label="modo" v={state.data.sections.billing.data.medicion_solo ? "medición" : "activo"} />
							</div>
						)}
					</SectionShell>
				</>
			)}
		</div>
	);
}

function Header({ onRefresh, onClose, loading }: { onRefresh: () => void; onClose: () => void; loading?: boolean }) {
	return (
		<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
			<span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#9db8d8" }}>
				ODI → Estado del ecosistema
			</span>
			<span>
				<button onClick={onRefresh} disabled={loading} style={btnStyle} aria-label="Refrescar">
					{loading ? "…" : "↻"}
				</button>
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

const panelStyle: React.CSSProperties = {
	height: "100%", overflowY: "auto", padding: 16,
	background: "#0a0f18", borderLeft: "1px solid #1e2b3d",
};
const rowStyle: React.CSSProperties = { display: "flex", gap: 10 };
const btnStyle: React.CSSProperties = {
	background: "transparent", border: "1px solid #2a3b52", color: "#9db8d8",
	borderRadius: 8, cursor: "pointer", fontSize: 13, padding: "3px 9px", marginLeft: 6,
};
