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
// RC-B2.2: tipos alineados EXACTAMENTE al DTO real (extras retirados: certification/badge/
// con_catalogo/medicion_solo/source/alive — el backend ya no los emite; el tipo no debe declararlos).
export interface StoreItem {
	store: string;
	grade: string | null;
	products: number;
}
export interface TiendasData { total: number; stores: StoreItem[]; }
export interface BillingData { estado: string | null; }
export interface ChromaData { colecciones: number; documentos: number; }

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

// RC-B2.2 · GUARD PROFUNDO: valida la FORMA INTERNA de cada sección, no solo su presencia.
// Una sección "ok" con data malformada (ej. {status:"ok", data:{}}) se DEGRADA a
// {status:"degraded", data:null} → el render nunca dereferencia campos ausentes → nunca crash.
const _num = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
const _shapeOk: Record<string, (d: unknown) => boolean> = {
	dispatch: (d) => !!d && typeof d === "object"
		&& _num((d as DispatchData).counts?.pending) && typeof (d as DispatchData).attention === "boolean"
		&& !!(d as DispatchData).metricas && _num((d as DispatchData).metricas.done_total),
	tiendas: (d) => !!d && Array.isArray((d as TiendasData).stores) && _num((d as TiendasData).total),
	billing: (d) => !!d && typeof d === "object" && "estado" in (d as object),
	chromadb: (d) => !!d && _num((d as ChromaData).colecciones) && _num((d as ChromaData).documentos),
};

// Devuelve un PanelRead SEGURO de renderizar, o null si la estructura base es inválida.
function normalizePanelRead(x: unknown): PanelRead | null {
	if (!x || typeof x !== "object") return null;
	const s = (x as { sections?: Record<string, unknown> }).sections;
	if (!s || typeof s !== "object") return null;
	const sections = {} as PanelRead["sections"];
	for (const k of ["dispatch", "tiendas", "billing", "chromadb"] as const) {
		const sec = (s as Record<string, unknown>)[k] as { status?: string; data?: unknown } | undefined;
		if (!sec || (sec.status !== "ok" && sec.status !== "degraded")) return null;
		// "ok" pero data malformada → DEGRADAR (no dejar pasar un objeto que rompería el render)
		if (sec.status === "ok" && !_shapeOk[k](sec.data)) {
			(sections as Record<string, unknown>)[k] = { status: "degraded", error_code: "malformed_section", data: null };
		} else {
			(sections as Record<string, unknown>)[k] = sec;
		}
	}
	const raw = x as { ok?: boolean; schema?: string; generated_at?: string };
	return { ok: !!raw.ok, schema: raw.schema ?? "", generated_at: raw.generated_at ?? "", sections };
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
		// RC-B2.2 · GUARD PROFUNDO: normaliza antes de renderizar. Estructura base inválida →
		// error visible; sección "ok" malformada → degradada. NUNCA un objeto que rompa el render.
		const norm = normalizePanelRead(raw);
		if (!norm) return { status: "error", code: "malformed" };
		return { status: "ready", data: norm, fetchedAt: Date.now() };
	} catch (e) {
		return { status: "error", code: (e as Error)?.name === "AbortError" ? "timeout" : "network" };
	} finally {
		clearTimeout(t);
	}
}
