// Bloque 2 · Puesto de mando · cliente de lectura del ecosistema.
// Llama GET /ecosistema/panel-read con el Bearer de la sesión del habitante.
// NUNCA envía X-ODI-Panel-Key (esa llave vive solo en el servidor). Solo lectura.

const PANEL_READ_URL = "https://api.liveodi.com/ecosistema/panel-read";

export type SectionStatus = "ok" | "degraded";

export interface Section<T> {
	status: SectionStatus;
	error_code?: string;
	data: T | null;
}

export interface DispatchData {
	counts: { pending: number; running: number; done: number; error: number; blocked: number };
	attention: boolean;
	// RC-B2.1: el upstream no expone ciclo/latencia → se muestran las métricas reales del dispatch.
	metricas: { done_total: number; done_con_evidencia: number; escaladas: number; re_dispatch: number };
	observed_at: string | null;
}
export interface StoreItem {
	store: string;
	grade: string | null;
	certification: string | null;
	products: number;
	badge: string | null;
}
export interface TiendasData { total: number; con_catalogo: number; stores: StoreItem[]; }
export interface BillingData { estado: string | null; medicion_solo: boolean; source: string | null; }
export interface ChromaData { colecciones: number; documentos: number; alive: boolean; }

export interface PanelRead {
	ok: boolean;
	schema: string;
	generated_at: string;
	sections: {
		dispatch: Section<DispatchData>;
		tiendas: Section<TiendasData>;
		billing: Section<BillingData>;
		chromadb: Section<ChromaData>;
	};
}

export type PanelFetchState =
	| { status: "loading" }
	| { status: "ready"; data: PanelRead; fetchedAt: number }
	| { status: "unauthorized" }        // 401 — identifícate
	| { status: "forbidden" }           // 403 — sin autoridad
	| { status: "error"; code?: string }; // 503/red/timeout

// Guard mínimo de forma: 4 secciones presentes, cada una con un status válido.
function isValidPanelRead(x: unknown): x is PanelRead {
	if (!x || typeof x !== "object") return false;
	const s = (x as { sections?: Record<string, unknown> }).sections;
	if (!s || typeof s !== "object") return false;
	for (const k of ["dispatch", "tiendas", "billing", "chromadb"]) {
		const sec = (s as Record<string, unknown>)[k] as { status?: string } | undefined;
		if (!sec || (sec.status !== "ok" && sec.status !== "degraded")) return false;
	}
	return true;
}

// GET autenticado con timeout. Rechaza 200 que en realidad sea HTML de fallback.
export async function fetchPanelRead(bearer: string | null, timeoutMs = 8000): Promise<PanelFetchState> {
	if (!bearer) return { status: "unauthorized" };
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		const resp = await fetch(PANEL_READ_URL, {
			method: "GET",
			headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" },
			signal: ctrl.signal,
		});
		if (resp.status === 401) return { status: "unauthorized" };
		if (resp.status === 403) return { status: "forbidden" };
		// 200 que no sea JSON = degradado (HTML de fallback, no datos)
		const ct = resp.headers.get("content-type") || "";
		if (!ct.includes("application/json")) return { status: "error", code: "non_json" };
		const raw = await resp.json();
		if (!resp.ok) return { status: "error", code: (raw as { error?: string })?.error };
		// RC-B2.1 · SCHEMA GUARD: validar forma mínima antes de dereferenciar (nunca crash
		// por un 200 incompleto → degradado visible). Las 4 secciones deben existir con {status}.
		if (!isValidPanelRead(raw)) return { status: "error", code: "malformed" };
		return { status: "ready", data: raw as PanelRead, fetchedAt: Date.now() };
	} catch (e) {
		return { status: "error", code: (e as Error)?.name === "AbortError" ? "timeout" : "network" };
	} finally {
		clearTimeout(t);
	}
}
