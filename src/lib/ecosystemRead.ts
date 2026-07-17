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
	frentes: number;
	counts: { pending: number; running: number; done: number; error: number; blocked: number };
	attention: boolean;
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
		const data = (await resp.json()) as PanelRead;
		if (!resp.ok) return { status: "error", code: (data as { error?: string })?.error };
		return { status: "ready", data, fetchedAt: Date.now() };
	} catch (e) {
		return { status: "error", code: (e as Error)?.name === "AbortError" ? "timeout" : "network" };
	} finally {
		clearTimeout(t);
	}
}
