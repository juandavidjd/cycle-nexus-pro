"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { detectStoreContext } from "@/lib/odiApi";

/*
 * LIVEODI — Habitat Real de ODI
 * Esfera que respira. Ramona y Tony presentes. Conversación natural.
 * HER reference: "Hello, I'm here." → conversación → detección → acción
 *
 * NO es chat. NO es dashboard. Es presencia.
 *
 * Camino B (Deuda #34, 30 abr → 1 may 2026): este componente NO usa odiChat()
 * de odiApi.ts — hace fetch(CHAT_URL) directo. Para que el habitante en /<store>
 * (ej /duna) reciba productos filtrados por su tienda, inyectamos
 * detectStoreContext() en cada body request, idéntico patrón que odiChat()
 * usa internamente. Refactor a odiChat completo queda como Camino A futuro.
 */

const P = {
	void: "#020509", deep: "#060d18", surface: "#0b1625",
	glass: "rgba(11,22,37,0.55)", border: "#162842",
	glow: "#3db8ff", alive: "#2ef08a", warm: "#ff9f43",
	spirit: "#c4a0ff", care: "#ff6b8a",
	text: "#d8e8ff", textSoft: "#8ba3c4", textDim: "#4a6585", textFaint: "#2d4058",
	ramona: "#c4a0ff", tony: "#49c2ff",
};

const CHAT_URL = "https://api.liveodi.com/odi/chat";
const SPEAK_URL = "https://api.liveodi.com/odi/chat/speak";
// 4F.2 · telemetry endpoint
// firma jdamg-2026-06-13-liveodi-voice-runtime-telemetry-v1
const TELEMETRY_URL = "https://api.liveodi.com/habitat/voice/telemetry";

// Genera correlation_id estable para un turno
function genCorrelationId(): string {
	const t = Date.now().toString(36);
	const r = Math.random().toString(36).slice(2, 8);
	return `corr_browser_${t}_${r}`;
}

// 5B · STT_ACRONYM_ODI_NORMALIZATION (firma jdamg-2026-06-13-stt-acronym-odi-normalization-v1)
// Normalizador CONSERVADOR · NO altera stt_text_raw · SOLO actúa en normalized_text
// y SOLO dentro del patrón de trazabilidad de voz viva ODI (codigo 749).
// NO convierte "hoy" globalmente.
export type SttNormalizationResult = {
	stt_text_raw: string;
	normalized_text: string;
	normalization_applied: boolean;
	normalization_rule: string | null;
	normalization_confidence: number;
};
export function normalizeOdiAcronym(raw: string): SttNormalizationResult {
	const out: SttNormalizationResult = {
		stt_text_raw: raw,
		normalized_text: raw,
		normalization_applied: false,
		normalization_rule: null,
		normalization_confidence: 0,
	};
	if (!raw) return out;
	// Detección estricta: la frase debe contener el patrón de trazabilidad.
	// Eso protege "hoy quiero revisar el carril comercio" de la normalización.
	const trazaPattern = /trazabilidad.{0,40}\d{3}|c[oó]digo\s+(siete\s+cuatro\s+nueve|749)/i;
	if (!trazaPattern.test(raw)) return out;
	// Caso 1: prefijo "hoy/oye/oy/o d i" → "ODI"
	const odiPrefixMatch = raw.match(/^(?<prefix>\s*)(?<word>hoy|oye|oy|o\s*d\s*i|odi)(?=\s+prueba)/i);
	let normalized = raw;
	let touched = false;
	if (odiPrefixMatch && odiPrefixMatch.groups) {
		const prefix = odiPrefixMatch.groups.prefix || "";
		normalized = prefix + "ODI" + normalized.slice(odiPrefixMatch[0].length);
		touched = true;
	}
	// Caso 2: "de un viva" → "de voz viva" SOLO dentro del patrón traza
	if (/de\s+un\s+viva/i.test(normalized)) {
		normalized = normalized.replace(/de\s+un\s+viva/gi, "de voz viva");
		touched = true;
	}
	if (!touched) return out;
	return {
		stt_text_raw: raw,
		normalized_text: normalized,
		normalization_applied: true,
		normalization_rule: "stt_acronym_odi_normalizer_v1",
		normalization_confidence: 0.9,
	};
}

// 5C-B2 · TRANSCRIPT_REVIEW antes de chat_api · firma jdamg-2026-06-13-stt-transcript-review-before-chat-v1
// Decide si la voz necesita revisión humana del transcript antes de enviarse al chat_api.
// REGLA CENTRAL: confirmar transcript NO es firma · NO autoriza ejecución mutativa.
const REVIEW_TRIGGER_WORDS = /\b(c[oó]digo|firm[oa]|orden|carril|ejecuta|ejecutar|publica|publicar|borr[ao]|borrar|tienda|paga|pagar|cierr[ao]|elimina|eliminar)\b/i;
const REVIEW_SUSPECT_PATTERNS = [
	/^hoy\s+prueba/i,
	/^oye\s+prueba/i,
	/desplazamiento\s+c[oó]digo/i,
	/de\s+un\s+viva/i,
];
export function requiresTranscriptReview(opts: {
	stt_text_raw: string;
	normalized_text: string;
	normalization_applied: boolean;
	normalization_confidence: number;
	route_used: string;
}): { required: boolean; reason: string | null } {
	const raw = opts.stt_text_raw || "";
	if (!raw) return { required: false, reason: null };
	if (opts.route_used !== "route_browser_speech_to_text") return { required: false, reason: null };
	// 1. normalización aplicó
	if (opts.normalization_applied) {
		return { required: true, reason: "normalization_applied" };
	}
	// 2. confianza baja
	if (opts.normalization_confidence > 0 && opts.normalization_confidence < 0.95) {
		return { required: true, reason: "normalization_confidence_low" };
	}
	// 3. raw distinto del normalized (defensive)
	if (raw !== opts.normalized_text) {
		return { required: true, reason: "raw_diverges_from_normalized" };
	}
	// 4. frase contiene palabras de riesgo
	if (REVIEW_TRIGGER_WORDS.test(raw)) {
		return { required: true, reason: "high_risk_keywords_present" };
	}
	// 5. patrón sospechoso STT degradado
	for (const p of REVIEW_SUSPECT_PATTERNS) {
		if (p.test(raw)) return { required: true, reason: "suspect_degraded_stt_pattern" };
	}
	// Caso por defecto: saludos simples y consultas no peligrosas pasan sin revisar
	return { required: false, reason: null };
}

// 4F.2RR · firma jdamg-2026-06-13-browser-voice-granular-telemetry-v1
// Genera voice_session_id estable a lo largo de la sesión browser y voice_turn_id por turno.
function genVoiceTurnId(): string {
	const t = Date.now().toString(36);
	const r = Math.random().toString(36).slice(2, 8);
	return `vt_browser_${t}_${r}`;
}
function genVoiceSessionId(): string {
	const t = Date.now().toString(36);
	const r = Math.random().toString(36).slice(2, 8);
	return `vs_browser_${t}_${r}`;
}

// Emite envelope post-turno sin bloquear UI · fire-and-forget
async function emitTelemetry(envelope: Record<string, unknown>): Promise<void> {
	try {
		await fetch(TELEMETRY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...envelope, voice_signature_accepted: false }),
		});
	} catch {
		// Telemetry failure NUNCA debe romper la UI
	}
}

const VOICE_META: Record<string, { color: string; label: string; role: string }> = {
	ramona: { color: "#c4a0ff", label: "Ramona", role: "anfitriona" },
	tony: { color: "#49c2ff", label: "Tony", role: "maestro" },
};

// 4F.1 · persona_mode coherence lock (firma jdamg-2026-06-13-odi-universal-voice-persona-v1)
// Ramona NUNCA debe mostrarse con modo commerce/diagnose/optimize.
// Tony NUNCA debe mostrarse con modo care/presence/guidance.
const PERSONA_MODE_ALLOWED: Record<string, string[]> = {
	ramona: ["presence", "care", "guidance", "empower", "learn"],
	tony: ["operation", "commerce", "diagnose", "optimize", "execution_summary"],
};
const PERSONA_MODE_FALLBACK: Record<string, string> = {
	ramona: "presence",
	tony: "operation",
};
function lockPersonaMode(voice: string | undefined, mode: string | undefined): string | undefined {
	if (!voice || !mode) return mode;
	const allowed = PERSONA_MODE_ALLOWED[voice];
	if (!allowed) return mode;
	return allowed.includes(mode) ? mode : PERSONA_MODE_FALLBACK[voice];
}

interface Msg {
	role: "user" | "odi";
	text: string;
	follow?: string;
	voice?: string;
	mode?: string;
	products?: { title: string; price: number; from: string }[];
}

function VoiceTag({ voice }: { voice?: string }) {
	const v = VOICE_META[voice || ""];
	if (!v) return null;
	return (
		<span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.52rem" }}>
			<span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color, boxShadow: `0 0 6px ${v.color}55` }} />
			<span style={{ color: v.color, fontWeight: 600 }}>{v.label}</span>
			<span style={{ color: P.textFaint }}>· {v.role}</span>
		</span>
	);
}

function ProductCard({ p }: { p: { title: string; price: number; from: string } }) {
	return (
		<div style={{ background: P.glass, border: `1px solid ${P.border}`, borderRadius: 10, padding: "10px 12px" }}>
			<div style={{ fontSize: "0.74rem", fontWeight: 600, color: P.text }}>{p.title}</div>
			<div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
				<span style={{ fontSize: "0.8rem", color: P.alive, fontWeight: 700 }}>${p.price?.toLocaleString("es-CO")}</span>
				<span style={{ fontSize: "0.56rem", color: P.textDim }}>{p.from}</span>
			</div>
		</div>
	);
}

function Bubble({ data, isODI }: { data: Msg; isODI: boolean }) {
	return (
		<div aria-live={isODI ? "polite" : "off"} style={{ maxWidth: "90%", alignSelf: isODI ? "flex-start" : "flex-end", animation: "msgIn 0.3s ease" }}>
			{isODI && (
				<div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
					<VoiceTag voice={data.voice} />
					{(() => { const m = lockPersonaMode(data.voice, data.mode); return m ? <span style={{ fontSize: "0.5rem", color: P.textDim, marginLeft: 8 }}>◆ {m}</span> : null; })()}
				</div>
			)}
			<p style={{ margin: 0, fontSize: isODI ? "0.9rem" : "0.84rem", lineHeight: 1.6, color: isODI ? P.text : P.textSoft, fontWeight: isODI ? 500 : 400 }}>
				{data.text}
			</p>
			{data.follow && <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: P.textSoft, lineHeight: 1.55 }}>{data.follow}</p>}
			{data.products && data.products.length > 0 && (
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 7, marginTop: 10 }}>
					{data.products.map((p, i) => <ProductCard key={i} p={p} />)}
				</div>
			)}
		</div>
	);
}

// ─── Ephemeral Window System ───
interface EphemeralData {
	type: string;
	ttl_ms: number;
	data: any;
}

function ProductCardsEphemeral({ products, onDismiss }: { products: any[]; onDismiss: () => void }) {
	return (
		<div style={{ background: P.glass, border: `1px solid ${P.border}`, borderRadius: 16, padding: "16px 18px", backdropFilter: "blur(12px)", minWidth: 280, maxWidth: 400 }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
				<VoiceTag voice="tony" />
				<button onClick={onDismiss} aria-label="Cerrar tarjetas de productos" style={{ background: "transparent", border: "none", color: P.textDim, cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
			</div>
			<div style={{ display: "grid", gap: 8 }}>
				{products.map((p: any, i: number) => (
					<div key={i} style={{ background: "rgba(6,13,24,0.6)", border: `1px solid ${P.border}`, borderRadius: 10, padding: "10px 12px" }}>
						<div style={{ fontSize: "0.74rem", fontWeight: 600, color: P.text }}>{p.title || p.titulo || ""}</div>
						<div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
							<span style={{ fontSize: "0.8rem", color: P.alive, fontWeight: 700 }}>${parseFloat(p.price || p.precio || 0).toLocaleString("es-CO")}</span>
							<span style={{ fontSize: "0.56rem", color: P.textDim }}>{p.from || p.tienda || ""}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function GuardianShieldEphemeral({ data }: { data: any }) {
	return (
		<div style={{ background: "rgba(255,68,102,0.08)", border: "2px solid #ff446644", borderRadius: 16, padding: "20px 24px", backdropFilter: "blur(12px)", minWidth: 280, textAlign: "center" }}>
			<div style={{ fontSize: "1.5rem", marginBottom: 8 }}>🛡</div>
			<p style={{ fontSize: "0.9rem", fontWeight: 600, color: P.care, margin: "0 0 6px" }}>Protocolo de cuidado activado</p>
			<p style={{ fontSize: "0.72rem", color: P.textSoft, margin: 0 }}>Estoy aquí contigo. No estás solo.</p>
		</div>
	);
}

function InfoCardEphemeral({ data, onDismiss }: { data: any; onDismiss: () => void }) {
	return (
		<div style={{ background: P.glass, border: `1px solid ${P.border}`, borderRadius: 16, padding: "16px 18px", backdropFilter: "blur(12px)", minWidth: 260, maxWidth: 380 }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
				<span style={{ fontSize: "0.72rem", fontWeight: 600, color: P.glow }}>{data.title || "Info"}</span>
				<button onClick={onDismiss} aria-label="Cerrar tarjeta de informacion" style={{ background: "transparent", border: "none", color: P.textDim, cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
			</div>
			<p style={{ fontSize: "0.76rem", color: P.textSoft, margin: 0, lineHeight: 1.5 }}>{data.content || ""}</p>
			{data.source && <p style={{ fontSize: "0.56rem", color: P.textFaint, marginTop: 6 }}>Fuente: {data.source}</p>}
		</div>
	);
}

function AuthPromptEphemeral({ data, onDismiss }: { data: any; onDismiss: () => void }) {
	const googleUrl = data.google_url || "https://api.liveodi.com/auth/google";
	return (
		<div style={{
			background: "rgba(11,22,37,0.95)", border: `1px solid ${P.spirit}33`,
			borderRadius: 18, padding: "24px 26px", backdropFilter: "blur(14px)",
			minWidth: 300, maxWidth: 380,
			boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${P.spirit}15`,
		}}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
				<div>
					<h3 style={{ fontSize: "1rem", fontWeight: 600, color: P.text, margin: 0, marginBottom: 4 }}>{data.title || "¿Puedo conocerte?"}</h3>
					<p style={{ fontSize: "0.74rem", color: P.textSoft, margin: 0, lineHeight: 1.55 }}>{data.body || "Inicia sesion y te reconozco la proxima vez."}</p>
				</div>
				<button onClick={onDismiss} aria-label="Cerrar"
					style={{ background: "transparent", border: "none", color: P.textDim, cursor: "pointer", fontSize: "0.8rem", marginLeft: 8 }}>✕</button>
			</div>
			<a href={googleUrl}
				style={{
					display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
					width: "100%", padding: "11px 14px", borderRadius: 12,
					background: "#ffffff", color: "#1f2937", fontSize: "0.82rem", fontWeight: 600,
					textDecoration: "none", marginTop: 14, transition: "all 0.2s",
				}}>
				<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
				Continuar con Google
			</a>
			<button onClick={onDismiss}
				style={{
					background: "transparent", border: "none", color: P.textDim,
					fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit",
					padding: "8px 0 0", width: "100%", textAlign: "center",
				}}>{data.skip_label || "Ahora no"}</button>
		</div>
	);
}

function RegistrationPrompt({ prompt, onAccept, onSkip }: { prompt: { type: string; text: string; acceptLabel: string }; onAccept: () => void; onSkip: () => void }) {
	return (
		<div style={{
			position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
			display: "flex", alignItems: "center", justifyContent: "center",
			zIndex: 90, background: "rgba(2,5,9,0.5)",
			animation: "fadeIn 0.3s ease",
		}} onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}>
			<div style={{
				background: "rgba(11,22,37,0.92)", border: `1px solid ${P.warm}22`,
				borderRadius: 16, padding: "20px 24px", backdropFilter: "blur(12px)",
				maxWidth: 320, animation: "msgIn 0.3s ease",
			}}>
				<p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: P.textSoft, lineHeight: 1.5 }}>{prompt.text}</p>
				<div style={{ display: "flex", gap: 8 }}>
					<button onClick={onAccept} style={{
						padding: "6px 16px", borderRadius: 8,
						background: `${P.warm}18`, border: `1px solid ${P.warm}33`,
						color: P.warm, fontSize: "0.68rem", fontWeight: 600,
						cursor: "pointer", fontFamily: "inherit",
					}}>{prompt.acceptLabel}</button>
					<button onClick={onSkip} style={{
						padding: "6px 16px", borderRadius: 8,
						background: "transparent", border: `1px solid ${P.border}`,
						color: P.textDim, fontSize: "0.68rem",
						cursor: "pointer", fontFamily: "inherit",
					}}>Ahora no</button>
				</div>
			</div>
		</div>
	);
}

function EphemeralWindow({ ephemeral, products, onDismiss }: { ephemeral: EphemeralData | null; products: any[]; onDismiss: () => void }) {
	const [visible, setVisible] = useState(true);
	const [fading, setFading] = useState(false);

	useEffect(() => {
		if (!ephemeral) return;
		setVisible(true);
		setFading(false);
		if (ephemeral.ttl_ms > 0) {
			const timer = setTimeout(() => {
				setFading(true);
				setTimeout(onDismiss, 300);
			}, ephemeral.ttl_ms);
			return () => clearTimeout(timer);
		}
	}, [ephemeral, onDismiss]);

	if (!ephemeral || !visible) return null;

	const dismiss = () => { setFading(true); setTimeout(onDismiss, 300); };

	return (
		<div style={{
			position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
			display: "flex", alignItems: "center", justifyContent: "center",
			zIndex: 80, background: "rgba(2,5,9,0.5)",
			animation: fading ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease",
			pointerEvents: "auto",
		}} onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
			{ephemeral.type === "product_cards" && <ProductCardsEphemeral products={products} onDismiss={dismiss} />}
			{ephemeral.type === "guardian_shield" && <GuardianShieldEphemeral data={ephemeral.data} />}
			{ephemeral.type === "info_card" && <InfoCardEphemeral data={ephemeral.data} onDismiss={dismiss} />}
			{ephemeral.type === "auth_prompt" && <AuthPromptEphemeral data={ephemeral.data} onDismiss={dismiss} />}
		</div>
	);
}

export default function LiveODI() {
	const [phase, setPhase] = useState<"greeting" | "doors" | "habitat">("greeting");
	const [msgs, setMsgs] = useState<Msg[]>([]);
	const [input, setInput] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [orbColor, setOrbColor] = useState(P.spirit);
	const [isSpeaking, setIsSpeaking] = useState(false);

	// Referral system
	const [referrer, setReferrer] = useState<string | null>(null);
	const referrerRef = useRef<string | null>(null);
	// Auth session (Google/Microsoft/Apple OAuth)
	const [authUser, setAuthUser] = useState<{ name?: string; email?: string; provider?: string; human_id?: string } | null>(null);
	const authTokenRef = useRef<string | null>(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const ref = params.get("ref");
		if (ref) { setReferrer(ref); referrerRef.current = ref; localStorage.setItem("odi_referrer", ref); }
		else { const saved = localStorage.getItem("odi_referrer"); if (saved) { setReferrer(saved); referrerRef.current = saved; } }

		// Capture session token from URL (OAuth callback) or localStorage
		const urlToken = params.get("session");
		const storedToken = localStorage.getItem("odi_session");
		const token = urlToken || storedToken;
		if (urlToken) {
			localStorage.setItem("odi_session", urlToken);
			// Clean URL
			const cleanUrl = window.location.pathname + (ref ? `?ref=${ref}` : "");
			window.history.replaceState({}, "", cleanUrl);
		}
		if (token) {
			authTokenRef.current = token;
			// Validate and fetch user data
			fetch("https://api.liveodi.com/auth/validate", {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()).then(data => {
				if (data && data.authenticated) {
					setAuthUser({ name: data.name, email: data.email, provider: data.provider, human_id: data.human_id });
				} else {
					localStorage.removeItem("odi_session");
					authTokenRef.current = null;
				}
			}).catch(() => {});
		}
	}, []);
	const [ephemeral, setEphemeral] = useState<EphemeralData | null>(null);
	const [ephProducts, setEphProducts] = useState<any[]>([]);
	const [accessMode, setAccessMode] = useState<string>(() => {
		if (typeof window === "undefined") return "voice";
		return localStorage.getItem("odi_a11y_mode") || "voice";
	});
	const [a11yOpen, setA11yOpen] = useState(false);
	const fontSize = accessMode === "large" ? 1.25 : 1;

	// ── Registration progresivo HER ──
	const [regState, setRegState] = useState(() => {
		if (typeof window === "undefined") return { voice: false, photo: false, santo: false, dismissed: { voice: false, photo: false, santo: false } };
		try { const c = localStorage.getItem("odi_reg"); return c ? JSON.parse(c) : { voice: false, photo: false, santo: false, dismissed: { voice: false, photo: false, santo: false } }; } catch { return { voice: false, photo: false, santo: false, dismissed: { voice: false, photo: false, santo: false } }; }
	});
	const turnRef = useRef(0);
	const [regPrompt, setRegPrompt] = useState<{ type: string; text: string; acceptLabel: string } | null>(null);

	const saveReg = useCallback((patch: any) => {
		setRegState((prev: any) => {
			const next = { ...prev, ...patch, dismissed: { ...prev.dismissed, ...(patch.dismissed || {}) } };
			try { localStorage.setItem("odi_reg", JSON.stringify(next)); } catch {}
			return next;
		});
	}, []);
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const sessionRef = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}`);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const isPlayingRef = useRef(false);
	// 4F.2RR · voice_session_id estable durante toda la sesión browser
	// firma jdamg-2026-06-13-browser-voice-granular-telemetry-v1
	const voiceSessionRef = useRef<string | null>(null);
	// Latencias TTS (capturadas en speak)
	const ttsStartRef = useRef<number | null>(null);
	const ttsLastLatencyRef = useRef<number | null>(null);
	// Latencia STT (capturada en onresult del SpeechRecognition · fallback null)
	const sttLastLatencyRef = useRef<number | null>(null);
	function ensureVoiceSessionId(): string {
		if (!voiceSessionRef.current) voiceSessionRef.current = genVoiceSessionId();
		return voiceSessionRef.current;
	}
	const hasConvo = msgs.length > 0 && phase === "habitat";
	const greetedRef = useRef(false);
	const startContinuousListenRef = useRef<(force?: boolean) => void>();
	// STT singleton refs — declarados arriba para que speak() pueda referenciarlos.
	const recognitionRef = useRef<any>(null);
	const isRecActiveRef = useRef(false);

	// TTS — declared early so useEffects can reference it
	const speak = useCallback((text: string, voice: string = "ramona") => {
		if (isPlayingRef.current || !text) return;
		// Hard-abort STT while speaking (stop() es soft, deja eventos pendientes que captan el TTS).
		// Singleton: NO nullamos la instancia — la preservamos para reusar al reabrir post-TTS.
		// Sólo marcamos inactiva para que startContinuousListen pueda reabrirla.
		try { recognitionRef.current?.abort(); } catch {}
		isRecActiveRef.current = false;
		isPlayingRef.current = true;
		setIsSpeaking(true);
		lastOdiTextRef.current = text;
		// 4F.2RR · capturar latencia TTS desde inicio del fetch hasta audio listo
		ttsStartRef.current = Date.now();
		// Non-blocking fetch with 8s timeout
		const ctrl = new AbortController();
		const timeout = setTimeout(() => ctrl.abort(), 8000);
		fetch(SPEAK_URL, {
			method: "POST", headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text: text.slice(0, 300), voice }),
			signal: ctrl.signal,
		}).then(r => { clearTimeout(timeout); return r.ok ? r.blob() : null; })
		.then(blob => {
			if (!blob) { isPlayingRef.current = false; setIsSpeaking(false); ttsEndTimeRef.current = Date.now(); return; }
			// 4F.2RR · TTS roundtrip latency
			if (ttsStartRef.current) ttsLastLatencyRef.current = Date.now() - ttsStartRef.current;
			const url = URL.createObjectURL(blob);
			const audio = audioRef.current || new Audio();
			audioRef.current = audio;
			audio.onended = () => { isPlayingRef.current = false; setIsSpeaking(false); ttsEndTimeRef.current = Date.now(); URL.revokeObjectURL(url); if (accessModeRef.current === "voice") setTimeout(() => startContinuousListenRef.current?.(true), 300); };
			audio.onerror = () => { isPlayingRef.current = false; setIsSpeaking(false); ttsEndTimeRef.current = Date.now(); };
			audio.src = url;
			audio.play().catch(() => { isPlayingRef.current = false; setIsSpeaking(false); ttsEndTimeRef.current = Date.now(); });
		}).catch(() => { clearTimeout(timeout); isPlayingRef.current = false; setIsSpeaking(false); ttsEndTimeRef.current = Date.now(); });
	}, []);

	// STT — patrón SINGLETON (AgentHabitat 0c08425). UNA sola instancia SpeechRecognition
	// se crea con new SR() la primera vez y se reusa. El chime nativo del navegador SOLO
	// dispara al instanciar+start por primera vez; stop/start sobre la MISMA instancia es
	// silencioso. Esto permite escucha permanente (Chrome cierra → onend → restart) sin
	// chime audible en cada ciclo.
	// (recognitionRef + isRecActiveRef declarados arriba — antes de speak.)
	const [isListening, setIsListening] = useState(false);
	const sendRef = useRef<(text: string) => void>();
	const lastOdiTextRef = useRef("");
	const ttsEndTimeRef = useRef(0);
	const silenceTimerRef = useRef<any>(null);

	// Force flag: cuando el usuario presiona el botón mic, queremos que arranque
	// SÍ O SÍ, ignorando bloqueos previos (TTS colgado, isPlayingRef orphan, etc.).
	const startContinuousListen = useCallback((force = false) => {
		if (!force && isPlayingRef.current) return;
		if (force) {
			// Limpieza defensiva: abortar audio que pueda estar colgado y limpiar refs.
			try { audioRef.current?.pause(); } catch {}
			isPlayingRef.current = false;
			setIsSpeaking(false);
			ttsEndTimeRef.current = Date.now();
		}
		if (isRecActiveRef.current) return; // ya activa
		const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SR) return;
		// Singleton: crear la instancia UNA sola vez por sesión.
		let rec = recognitionRef.current;
		if (!rec) {
			rec = new SR();
			rec.lang = "es-CO";
			rec.continuous = true;
			rec.interimResults = true;
			recognitionRef.current = rec;
		}
		// Handlers se re-vinculan cada vez para capturar closures frescos.
		// VOLVIENDO a la versión que funcionaba (b429b1d singleton STT), con timer ampliado
		// de 1800ms a 2500ms para no cortar a media frase. Sin lógicas de conjunción ni
		// fallback interim (introducían bugs que rompían captura en celular).
		// 4F.2RR · capturar inicio de habla para calcular STT latency
		rec.onspeechstart = () => {
			(rec as any)._sttStart = Date.now();
		};
		rec.onresult = (event: any) => {
			// Eco-guard TTS: si Ramona habla o acaba de hablar (<800ms), descartar (sería eco).
			if (isPlayingRef.current || (Date.now() - ttsEndTimeRef.current) < 800) return;
			if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
			// Tomar SOLO el último isFinal (Chrome Android repite finals; no concatenar).
			let lastFinalIdx = -1;
			for (let i = 0; i < event.results.length; i++) {
				if (event.results[i].isFinal) lastFinalIdx = i;
			}
			// Fallback al último interim si Chrome Android no emitió isFinal antes del timer.
			// Sin esto la frase se pierde silenciosamente: text="" → sendRef no se llama,
			// pero rec.stop() sí dispara → bucle silencioso (mic dice "escuchando" pero nada llega).
			let fullText = "";
			if (lastFinalIdx >= 0) {
				fullText = event.results[lastFinalIdx][0].transcript || "";
			} else if (event.results.length > 0) {
				fullText = event.results[event.results.length - 1][0].transcript || "";
			}
			// 4F.2RR · STT latency (speechstart → result final). null si onspeechstart no disparó.
			const sttStart = (rec as any)._sttStart;
			if (sttStart) {
				sttLastLatencyRef.current = Date.now() - sttStart;
				(rec as any)._sttStart = null;
			}
			silenceTimerRef.current = setTimeout(() => {
				const text = fullText.trim();
				if (text && text.length >= 2 && !isPlayingRef.current) {
					if (sendRef.current) sendRef.current(text);
				}
				// stop() necesario en Chrome Android para limpiar event.results y mantener captura viva.
				// onend dispara → restart sobre la MISMA instancia → SILENCIOSO (singleton).
				try { rec.stop(); } catch {}
			}, 2500);
		};
		rec.onend = () => {
			setIsListening(false);
			isRecActiveRef.current = false;
			// Re-start sobre la MISMA instancia (sin new SR) → sin chime audible.
			if (!isPlayingRef.current && accessModeRef.current === "voice") {
				setTimeout(() => {
					if (!isPlayingRef.current && !isRecActiveRef.current) {
						try { rec.start(); isRecActiveRef.current = true; setIsListening(true); } catch { isRecActiveRef.current = false; }
					}
				}, 300);
			}
		};
		rec.onerror = (e: any) => {
			setIsListening(false);
			isRecActiveRef.current = false;
			if (e.error !== "not-allowed" && e.error !== "service-not-allowed") {
				setTimeout(() => {
					if (!isPlayingRef.current && accessModeRef.current === "voice" && !isRecActiveRef.current) {
						try { rec.start(); isRecActiveRef.current = true; setIsListening(true); } catch { isRecActiveRef.current = false; }
					}
				}, 800);
			}
		};
		try {
			rec.start();
			isRecActiveRef.current = true;
			setIsListening(true);
		} catch (e: any) {
			// InvalidStateError = SR ya está activa internamente aunque nuestro flag diga lo contrario.
			// Abortar y reintentar 200ms después una sola vez.
			if (e?.name === "InvalidStateError") {
				try { rec.abort(); } catch {}
				setTimeout(() => {
					try {
						rec.start();
						isRecActiveRef.current = true;
						setIsListening(true);
					} catch {
						isRecActiveRef.current = false;
						setIsListening(false);
					}
				}, 200);
			} else {
				isRecActiveRef.current = false;
				setIsListening(false);
			}
		}
	}, []);

	const accessModeRef = useRef(accessMode);
	useEffect(() => { accessModeRef.current = accessMode; }, [accessMode]);
	useEffect(() => { startContinuousListenRef.current = startContinuousListen; }, [startContinuousListen]);

	const tapToListen = useCallback(() => {
		if (isPlayingRef.current || isListening) return;
		startContinuousListen();
	}, [isListening, startContinuousListen]);

	// VLibras toggle — show/hide widget based on signs mode
	useEffect(() => {
		const widget = document.getElementById("vlibras-widget");
		if (!widget) return;
		widget.style.display = accessMode === "signs" ? "block" : "none";
	}, [accessMode]);

	// Scroll on new messages
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [msgs]);

	// Auto-greet on mount — Ramona speaks immediately, then show doors.
	// Bug previo: deps [speak, authUser] hacían que el effect re-corriera cuando llegaba
	// authUser tras /auth/validate, cancelando el setTimeout original con el cleanup, y
	// como greetedRef ya estaba en true, el saludo NUNCA se ejecutaba → phase quedaba
	// en "greeting" para siempre (solo se veía la esfera, sin puertas, sin saludo).
	// Fix: deps [] (corre UNA vez al mount), usar authUserRef que se actualiza en otro
	// effect, y setear greetedRef DENTRO del callback (no antes) para evitar bloqueo
	// si por alguna razón el effect intentara correr de nuevo.
	const authUserRef = useRef<{ name?: string; email?: string } | null>(null);
	useEffect(() => { authUserRef.current = authUser; }, [authUser]);
	useEffect(() => {
		const timer = setTimeout(() => {
			if (greetedRef.current) return;
			greetedRef.current = true;
			const ref = referrerRef.current;
			const firstName = authUserRef.current?.name?.split(" ")[0];
			let greeting: string;
			if (firstName) {
				greeting = `Hola ${firstName}.`;
			} else if (ref) {
				greeting = `Hola. ${ref} me habló de ti.`;
			} else {
				greeting = "Hola.";
			}
			setMsgs([{ role: "odi", text: greeting, voice: "ramona", mode: "presence" }]);
			speak(greeting, "ramona");
			// Show doors after greeting audio starts
			setTimeout(() => setPhase("doors"), 600);
		}, 1200);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 5C-B2 · pendingReview state · firma jdamg-2026-06-13-stt-transcript-review-before-chat-v1
	const [pendingReview, setPendingReview] = useState<null | {
		correlationId: string;
		turnId: string;
		voiceText: string;
		normResult: SttNormalizationResult;
		reviewReason: string;
		startedAt: number;
		editing: string;
	}>(null);

	// 5E-B1R1A · refs declarados antes de sendText para evitar TDZ
	const pendingReviewRef = useRef<typeof pendingReview>(null);
	useEffect(() => { pendingReviewRef.current = pendingReview; }, [pendingReview]);
	const emitReviewCloseLoopRef = useRef<((action: "abandoned" | "timeout" | "navigated_away" | "superseded") => void) | null>(null);
	// Send message to Chat API
	const sendText = useCallback(async (voiceText: string) => {
		if (!voiceText || isSending) return;
		// 5E-B1R1A · superseded: si hay review pendiente y el habitante inicia nuevo turn,
		// cierra el review anterior como append-only antes de procesar el nuevo.
		// firma jdamg-2026-06-15-transcript-review-ui-close-loop-fix-v1
		if (pendingReviewRef.current && emitReviewCloseLoopRef.current) emitReviewCloseLoopRef.current("superseded");
		setIsSending(true);
		turnRef.current++;
		// 4F.2 · correlation id por turno
		const correlationId = genCorrelationId();
		const turnId = `turn_${turnRef.current}`;
		// 5C-B2 · calcular normalización + review ANTES de pintar al usuario
		const _isVoiceCh = !(accessMode === "text" || accessMode === "signs");
		const _routeUsed = _isVoiceCh ? "route_browser_speech_to_text" : "route_text_response";
		const _norm = normalizeOdiAcronym(voiceText);
		const _review = requiresTranscriptReview({
			stt_text_raw: _norm.stt_text_raw,
			normalized_text: _norm.normalized_text,
			normalization_applied: _norm.normalization_applied,
			normalization_confidence: _norm.normalization_confidence,
			route_used: _routeUsed,
		});
		// Si el voiceText viene del path de texto (sendForm de teclado) NUNCA review
		const _shouldReview = _isVoiceCh && _review.required;
		if (_shouldReview) {
			// Mostrar burbuja con el RAW (lo que escuchamos)
			setMsgs(prev => [...prev, { role: "user", text: voiceText }]);
			setPendingReview({
				correlationId, turnId, voiceText, normResult: _norm,
				reviewReason: _review.reason || "unknown",
				startedAt: Date.now(),
				editing: _norm.normalization_applied ? _norm.normalized_text : voiceText,
			});
			// 5C-B2 · telemetría · marca que la revisión fue mostrada pero AÚN no se decidió
			emitTelemetry({
				correlation_id: correlationId,
				conversation_id: sessionRef.current,
				turn_id: turnId,
				voice_session_id: _isVoiceCh ? ensureVoiceSessionId() : undefined,
				voice_turn_id: _isVoiceCh ? genVoiceTurnId() : undefined,
				channel: _isVoiceCh ? "voice" : "text",
				actor: "architect",
				ui_actor: "ramona",
				persona_mode: "presence",
				route_used: "route_browser_speech_to_text_review",
				input_text: voiceText,
				stt_text_raw: _norm.stt_text_raw,
				normalized_text: _norm.normalized_text,
				normalization_applied: _norm.normalization_applied,
				normalization_rule: _norm.normalization_rule,
				normalization_confidence: _norm.normalization_confidence,
				review_required: true,
				review_reason: _review.reason,
				review_displayed: true,
				review_action: "pending",
				stt_provider: "browser_web_speech",
				stt_latency_ms: sttLastLatencyRef.current,
				stt_status: sttLastLatencyRef.current != null ? "ok" : "not_measured",
				task_created: false,
				action_executed: false,
				voice_signature_accepted: false,
			});
			setIsSending(false);
			return;
		}
		// Path normal: no requiere review · envía directo
		setMsgs(prev => [...prev, { role: "user", text: voiceText }]);
		try {
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (authTokenRef.current) headers["Authorization"] = `Bearer ${authTokenRef.current}`;
			// Camino B (Deuda #34): inyectar default_store si URL es /<store>
			const _storeCtx = detectStoreContext();
			const _payload: Record<string, unknown> = {
				message: voiceText,
				session_id: sessionRef.current,
				// 4F.1 · default presence (Ramona-coherent) en lugar de commerce hardcoded
				mode: "presence",
				user_name: authUser?.name,
			};
			if (_storeCtx) _payload.default_store = _storeCtx;
			const resp = await fetch(CHAT_URL, {
				method: "POST", headers,
				body: JSON.stringify(_payload),
			});
			if (resp.ok) {
				const data = await resp.json();
				const responseText = data.response || "";
				const voice = data.voice || "ramona";
				const mode = data.mode || "presence";
				const products = (data.productos || []).map((p: any) => ({
					title: p.title || p.titulo || "",
					price: parseFloat(p.price || p.precio || 0),
					from: p.from || p.tienda || "",
				})).filter((p: any) => p.title);
				setOrbColor(voice === "tony" ? P.glow : P.spirit);
				const lockedMode = lockPersonaMode(voice, mode) || mode;
				setMsgs(prev => [...prev, { role: "odi", text: responseText, voice, mode, products: products.length > 0 ? products : undefined }]);
				lastOdiTextRef.current = responseText;
				const visual = data.visual;
				if (visual && visual.type) { setEphProducts(data.productos || []); setEphemeral(visual); }
				if (accessMode !== "text" && accessMode !== "signs") { speak(responseText, voice); }
				// 4F.2 · telemetría runtime · post-turno · cero efectos secundarios
				// 4F.2RR · envelope granular · voice_session_id + voice_turn_id + latencias
				// 5B · normalizador STT_ACRONYM_ODI · stt_text_raw intacto · normalized_text corregido
				// 5C-B2 · path sin review · review_required=false · sent_to_chat_text=voiceText raw
				const _isVoice = !(accessMode === "text" || accessMode === "signs");
				emitTelemetry({
					correlation_id: correlationId,
					conversation_id: sessionRef.current,
					turn_id: turnId,
					voice_session_id: _isVoice ? ensureVoiceSessionId() : undefined,
					voice_turn_id: _isVoice ? genVoiceTurnId() : undefined,
					channel: _isVoice ? "voice" : "text",
					actor: "architect",
					ui_actor: voice,
					persona_mode: lockedMode,
					route_used: _isVoice ? "route_browser_speech_to_text" : "route_text_response",
					input_text: voiceText,
					stt_text_raw: _norm.stt_text_raw,
					normalized_text: _norm.normalized_text,
					normalization_applied: _norm.normalization_applied,
					normalization_rule: _norm.normalization_rule,
					normalization_confidence: _norm.normalization_confidence,
					review_required: false,
					review_displayed: false,
					review_action: "not_required",
					sent_to_chat_text: voiceText,
					stt_provider: "browser_web_speech",
					tts_provider: _isVoice ? "elevenlabs" : undefined,
					stt_latency_ms: sttLastLatencyRef.current,
					tts_latency_ms: _isVoice ? ttsLastLatencyRef.current : null,
					stt_status: sttLastLatencyRef.current != null ? "ok" : "not_measured",
					tts_status: _isVoice ? (ttsLastLatencyRef.current != null ? "ok" : "not_measured") : undefined,
					task_created: false,
					action_executed: false,
				});
			}
		} catch {
			setMsgs(prev => [...prev, { role: "odi", text: "No logré completar la conexión en este intento. La interfaz de texto sigue disponible. ¿Quieres reintentar, o prefieres que revise el estado de la ruta?", voice: "ramona", mode: "care" }]);
			// 4F.2 · telemetría también en fallback · marca la falla sin bloquear UI
			// 4F.2RR · fallback envelope · también con voice_session_id para tracear sesión completa
			emitTelemetry({
				correlation_id: correlationId,
				conversation_id: sessionRef.current,
				turn_id: turnId,
				voice_session_id: ensureVoiceSessionId(),
				voice_turn_id: genVoiceTurnId(),
				channel: "voice",
				actor: "architect",
				ui_actor: "ramona",
				persona_mode: "care",
				route_used: "route_text_fallback",
				input_text: voiceText,
				fallback_triggered: true,
				stt_provider: "browser_web_speech",
				stt_latency_ms: sttLastLatencyRef.current,
				stt_status: sttLastLatencyRef.current != null ? "ok" : "not_measured",
				task_created: false,
				action_executed: false,
			});
		}
		setIsSending(false);
	}, [isSending, speak, accessMode, authUser]);

	// 5C-B2 · dispatchAfterReview: el usuario confirma/edita/cancela el transcript.
	// CRITICAL: confirmar transcript ≠ firma · NO autoriza ejecución mutativa.
	// 5C-B2-FIX (firma jdamg-2026-06-13-transcript-review-post-click-dedup-fix-v1):
	// turn_id post-review único = <original>_reviewed_<action>_<t36>
	// Mantiene dos eventos auditables en odi_conversation_events:
	//   evento 1 (review_action=pending) + evento 2 (review_action=confirmed|edited|cancelled)
	// Evita UniqueViolation 409 de UNIQUE(conversation_id, turn_id).
	const dispatchAfterReview = useCallback(async (
		action: "confirmed" | "edited" | "cancelled",
		finalText: string
	) => {
		const review = pendingReview;
		if (!review) return;
		setPendingReview(null);
		const { correlationId, turnId, voiceText, normResult } = review;
		const _isVoice = !(accessMode === "text" || accessMode === "signs");
		// 5C-B2-FIX · turn_id único post-review
		const reviewTurnId = `${turnId}_reviewed_${action}_${Date.now().toString(36)}`;
		if (action === "cancelled") {
			// No envía a chat_api · solo registra la cancelación en telemetría
			setMsgs(prev => [...prev, { role: "odi", text: "Cancelado. No envié nada al Hábitat. Cuando quieras intentamos de nuevo.", voice: "ramona", mode: "care" }]);
			emitTelemetry({
				correlation_id: correlationId,
				conversation_id: sessionRef.current,
				turn_id: reviewTurnId,
				original_turn_id: turnId,
				review_of_turn_id: turnId,
				voice_session_id: _isVoice ? ensureVoiceSessionId() : undefined,
				voice_turn_id: _isVoice ? genVoiceTurnId() : undefined,
				channel: _isVoice ? "voice" : "text",
				actor: "architect",
				ui_actor: "ramona",
				persona_mode: "care",
				route_used: "route_browser_speech_to_text_review_cancelled",
				input_text: voiceText,
				stt_text_raw: normResult.stt_text_raw,
				normalized_text: normResult.normalized_text,
				normalization_applied: normResult.normalization_applied,
				normalization_rule: normResult.normalization_rule,
				normalization_confidence: normResult.normalization_confidence,
				review_required: true,
				review_reason: review.reviewReason,
				review_displayed: true,
				review_action: "cancelled",
				reviewed_text: null,
				sent_to_chat_text: null,
				stt_provider: "browser_web_speech",
				task_created: false,
				action_executed: false,
				voice_signature_accepted: false,
			});
			return;
		}
		setIsSending(true);
		const reviewedText = action === "edited" ? finalText : (normResult.normalization_applied ? normResult.normalized_text : voiceText);
		try {
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (authTokenRef.current) headers["Authorization"] = `Bearer ${authTokenRef.current}`;
			const _storeCtx = detectStoreContext();
			const _payload: Record<string, unknown> = {
				message: reviewedText, session_id: sessionRef.current,
				mode: "presence", user_name: authUser?.name,
			};
			if (_storeCtx) _payload.default_store = _storeCtx;
			const resp = await fetch(CHAT_URL, { method: "POST", headers, body: JSON.stringify(_payload) });
			if (resp.ok) {
				const data = await resp.json();
				const responseText = data.response || "";
				const voice = data.voice || "ramona";
				const mode = data.mode || "presence";
				const lockedMode = lockPersonaMode(voice, mode) || mode;
				setOrbColor(voice === "tony" ? P.glow : P.spirit);
				setMsgs(prev => [...prev, { role: "odi", text: responseText, voice, mode }]);
				lastOdiTextRef.current = responseText;
				if (accessMode !== "text" && accessMode !== "signs") { speak(responseText, voice); }
				emitTelemetry({
					correlation_id: correlationId,
					conversation_id: sessionRef.current,
					turn_id: reviewTurnId,
					original_turn_id: turnId,
					review_of_turn_id: turnId,
					voice_session_id: _isVoice ? ensureVoiceSessionId() : undefined,
					voice_turn_id: _isVoice ? genVoiceTurnId() : undefined,
					channel: _isVoice ? "voice" : "text",
					actor: "architect",
					ui_actor: voice,
					persona_mode: lockedMode,
					route_used: action === "edited"
						? "route_browser_speech_to_text_review_edited"
						: "route_browser_speech_to_text_review_confirmed",
					input_text: voiceText,
					stt_text_raw: normResult.stt_text_raw,
					normalized_text: normResult.normalized_text,
					normalization_applied: normResult.normalization_applied,
					normalization_rule: normResult.normalization_rule,
					normalization_confidence: normResult.normalization_confidence,
					review_required: true,
					review_reason: review.reviewReason,
					review_displayed: true,
					review_action: action,
					reviewed_text: reviewedText,
					sent_to_chat_text: reviewedText,
					stt_provider: "browser_web_speech",
					tts_provider: _isVoice ? "elevenlabs" : undefined,
					stt_latency_ms: sttLastLatencyRef.current,
					tts_latency_ms: _isVoice ? ttsLastLatencyRef.current : null,
					stt_status: sttLastLatencyRef.current != null ? "ok" : "not_measured",
					task_created: false,
					action_executed: false,
					voice_signature_accepted: false,
				});
			}
		} catch {
			setMsgs(prev => [...prev, { role: "odi", text: "No logré completar la conexión en este intento. La interfaz de texto sigue disponible.", voice: "ramona", mode: "care" }]);
		}
		setIsSending(false);
	}, [pendingReview, accessMode, authUser, speak]);

	// 5E-B1R1A · close-loop append-only para reviews abandonados sin botón.
	// firma jdamg-2026-06-15-transcript-review-ui-close-loop-fix-v1
	// Emite 4 review_action kinds nuevos: abandoned · timeout · navigated_away · superseded.
	// Patrón append-only idéntico a dispatchAfterReview: turn_id suffix _reviewed_<action>_<t36>.
	// Invariante: confirmar/cancelar/editar/abandonar NUNCA son firma · voice_signature_accepted=false.
	const emitReviewCloseLoop = useCallback((action: "abandoned" | "timeout" | "navigated_away" | "superseded") => {
		const review = pendingReviewRef.current;
		if (!review) return;
		pendingReviewRef.current = null;
		setPendingReview(null);
		const { correlationId, turnId, voiceText, normResult } = review;
		const _isVoice = !(accessModeRef.current === "text" || accessModeRef.current === "signs");
		const reviewTurnId = `${turnId}_reviewed_${action}_${Date.now().toString(36)}`;
		emitTelemetry({
			correlation_id: correlationId,
			conversation_id: sessionRef.current,
			turn_id: reviewTurnId,
			original_turn_id: turnId,
			review_of_turn_id: turnId,
			voice_session_id: _isVoice ? ensureVoiceSessionId() : undefined,
			voice_turn_id: _isVoice ? genVoiceTurnId() : undefined,
			channel: _isVoice ? "voice" : "text",
			actor: "architect",
			ui_actor: "ramona",
			persona_mode: "care",
			route_used: `route_browser_speech_to_text_review_${action}`,
			input_text: voiceText,
			stt_text_raw: normResult.stt_text_raw,
			normalized_text: normResult.normalized_text,
			normalization_applied: normResult.normalization_applied,
			normalization_rule: normResult.normalization_rule,
			normalization_confidence: normResult.normalization_confidence,
			review_required: true,
			review_reason: review.reviewReason,
			review_displayed: true,
			review_action: action,
			reviewed_text: null,
			sent_to_chat_text: null,
			stt_provider: "browser_web_speech",
			task_created: false,
			action_executed: false,
			voice_signature_accepted: false,
		});
	}, []);
	// Wire ref para superseded desde sendText
	useEffect(() => { emitReviewCloseLoopRef.current = emitReviewCloseLoop; }, [emitReviewCloseLoop]);
	// timeout · 60s sin decisión cierra como timeout
	useEffect(() => {
		if (!pendingReview) return;
		const t = setTimeout(() => emitReviewCloseLoop("timeout"), 60000);
		return () => clearTimeout(t);
	}, [pendingReview, emitReviewCloseLoop]);
	// abandoned + navigated_away · window listeners global mientras haya pending
	useEffect(() => {
		const onBeforeUnload = () => { if (pendingReviewRef.current) emitReviewCloseLoop("abandoned"); };
		const onVisibilityHidden = () => {
			if (document.visibilityState === "hidden" && pendingReviewRef.current) emitReviewCloseLoop("navigated_away");
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		document.addEventListener("visibilitychange", onVisibilityHidden);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			document.removeEventListener("visibilitychange", onVisibilityHidden);
		};
	}, [emitReviewCloseLoop]);

	// Wire sendRef for STT
	useEffect(() => { sendRef.current = sendText; }, [sendText]);

	// Safety: force reset isSending after 15s
	useEffect(() => {
		if (!isSending) return;
		const t = setTimeout(() => setIsSending(false), 15000);
		return () => clearTimeout(t);
	}, [isSending]);

	// Safety: force reset isPlaying after 30s
	useEffect(() => {
		if (!isSpeaking) return;
		const t = setTimeout(() => { isPlayingRef.current = false; setIsSpeaking(false); ttsEndTimeRef.current = Date.now(); }, 30000);
		return () => clearTimeout(t);
	}, [isSpeaking]);

	const send = useCallback(async () => {
		const text = input.trim();
		if (!text || isSending) return;
		setInput("");
		setIsSending(true);
		turnRef.current++;
		// 4F.2 · correlation id por turno
		const correlationId = genCorrelationId();
		const turnId = `turn_${turnRef.current}`;

		setMsgs(prev => [...prev, { role: "user", text }]);

		try {
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (authTokenRef.current) headers["Authorization"] = `Bearer ${authTokenRef.current}`;
			// Camino B (Deuda #34): inyectar default_store si URL es /<store>
			const _storeCtx = detectStoreContext();
			const _payload: Record<string, unknown> = {
				message: text,
				session_id: sessionRef.current,
				// 4F.1 · default presence (Ramona-coherent) en lugar de commerce hardcoded
				// el backend cambia a tony+commerce si detecta intención comercial real
				mode: "presence",
				user_name: authUser?.name,
			};
			if (_storeCtx) _payload.default_store = _storeCtx;
			const resp = await fetch(CHAT_URL, {
				method: "POST", headers,
				body: JSON.stringify(_payload),
			});
			if (resp.ok) {
				const data = await resp.json();
				const responseText = data.response || "";
				const voice = data.voice || "ramona";
				const mode = data.mode || "presence";
				const products = (data.productos || []).map((p: any) => ({
					title: p.title || p.titulo || "",
					price: parseFloat(p.price || p.precio || 0),
					from: p.from || p.tienda || "",
				})).filter((p: any) => p.title);

				setOrbColor(voice === "tony" ? P.glow : P.spirit);
				setMsgs(prev => [...prev, { role: "odi", text: responseText, voice, mode, products: products.length > 0 ? products : undefined }]);
				lastOdiTextRef.current = responseText;

				// Ephemeral window from visual contract
				const visual = data.visual;
				if (visual && visual.type) {
					setEphProducts(data.productos || []);
					setEphemeral(visual);
				}

				// Auto-speak (only if not text-only or signs mode)
				if (accessMode !== "text" && accessMode !== "signs") {
					speak(responseText, voice);
				}
				// 4F.2 · telemetría runtime para canal texto · post-turno
				const lockedMode = lockPersonaMode(voice, mode) || mode;
				emitTelemetry({
					correlation_id: correlationId,
					conversation_id: sessionRef.current,
					turn_id: turnId,
					channel: "text",
					actor: "architect",
					ui_actor: voice,
					persona_mode: lockedMode,
					route_used: "route_text_response",
					input_text: text,
					normalized_text: text.toLowerCase(),
					task_created: false,
					action_executed: false,
				});
			}
		} catch {
			setMsgs(prev => [...prev, { role: "odi", text: "No logré completar la conexión en este intento. La interfaz de texto sigue disponible. ¿Quieres reintentar, o prefieres que revise el estado de la ruta?", voice: "ramona", mode: "care" }]);
			// 4F.2 · telemetría también en fallback canal texto
			emitTelemetry({
				correlation_id: correlationId,
				conversation_id: sessionRef.current,
				turn_id: turnId,
				channel: "text",
				actor: "architect",
				ui_actor: "ramona",
				persona_mode: "care",
				route_used: "route_text_fallback",
				input_text: text,
				fallback_triggered: true,
				task_created: false,
				action_executed: false,
			});
		}
		setIsSending(false);

		// Registration progresivo HER
		const t = turnRef.current;
		if (t === 3 && !regState.voice && !regState.dismissed.voice) {
			setTimeout(() => setRegPrompt({ type: "voice", text: "Puedo escucharte si activas el microfono. No grabo nada — solo escucho en el momento.", acceptLabel: "Activar voz" }), 1500);
		} else if (t === 8 && !regState.photo && !regState.dismissed.photo) {
			setTimeout(() => setRegPrompt({ type: "photo", text: "Tu rostro me ayuda a saber que eres tu. ¿Me permites verte?", acceptLabel: "Activar camara" }), 1500);
		} else if (t === 14 && !regState.santo && !regState.dismissed.santo) {
			setTimeout(() => setRegPrompt({ type: "santo", text: "Elige una frase que solo tu y yo conozcamos. Tu santo y sena.", acceptLabel: "Elegir frase" }), 1500);
		}
	}, [input, isSending, speak, regState]);

	return (
		<div lang="es" role="application" aria-label="LiveODI Habitat" style={{
			minHeight: "100vh",
			background: `radial-gradient(ellipse at 50% 15%, ${P.deep} 0%, ${P.void} 65%)`,
			color: accessMode === "large" ? "#f0f4ff" : P.text,
			fontFamily: "'DM Sans', system-ui, sans-serif",
			fontSize: `${fontSize}rem`,
			display: "flex", flexDirection: "column", overflow: "hidden",
		}}>
			{/* OC-16-A11Y: Skip link J1 ciego — primera tab key acceso directo a conversación */}
			<a
				href="#odi-conversation"
				style={{
					position: "absolute", top: 8, left: 8, zIndex: 100,
					padding: "8px 16px", borderRadius: 8,
					background: P.glow, color: P.void,
					fontSize: "0.7rem", fontWeight: 600,
					textDecoration: "none",
					transform: "translateY(-200%)",
					transition: "transform 0.2s",
				}}
				onFocus={(e) => { (e.target as HTMLElement).style.transform = "translateY(0)"; }}
				onBlur={(e) => { (e.target as HTMLElement).style.transform = "translateY(-200%)"; }}
			>
				Saltar a la conversacion con ODI
			</a>
			{/* Header */}
			<header role="banner" style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<span style={{ fontSize: "0.6rem", letterSpacing: "0.22em", color: P.textDim, fontWeight: 600 }}>O D I</span>
					<span aria-label="Organismo activo" style={{ width: 6, height: 6, borderRadius: "50%", background: P.alive, boxShadow: `0 0 8px ${P.alive}44` }} />
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<span style={{ fontSize: "0.45rem", color: isSpeaking ? P.spirit : isListening ? P.alive : isSending ? P.warm : P.textFaint }}>
					{isSpeaking ? "hablando..." : isListening ? "escuchando..." : isSending ? "pensando..." : "inactivo"}
				</span>
					{/* Registration dots */}
					{phase === "habitat" && (
						<div style={{ display: "flex", gap: 3 }} title="Registro: voz · rostro · santo y sena" aria-label={`Registro: ${[regState.voice && "voz", regState.photo && "rostro", regState.santo && "santo y sena"].filter(Boolean).join(", ") || "pendiente"}`}>
							{(["voice", "photo", "santo"] as const).map(k => (
								<span key={k} style={{ width: 5, height: 5, borderRadius: "50%", background: regState[k] ? P.alive : P.textFaint, transition: "all 0.5s" }} />
							))}
						</div>
					)}
					{phase === "habitat" && (
						<button onClick={() => {
							const name = prompt("Tu nombre (para la recomendacion):");
							if (name) {
								const url = `https://liveodi.com?ref=${encodeURIComponent(name)}`;
								if (navigator.share) { navigator.share({ title: "ODI", text: `${name} te recomienda ODI`, url }); }
								else { navigator.clipboard.writeText(url); alert("Link copiado: " + url); }
							}
						}} aria-label="Compartir ODI"
							style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 8, padding: "4px 8px", color: P.textDim, fontSize: "0.58rem", cursor: "pointer", fontFamily: "inherit" }}>
							↗
						</button>
					)}
					<button onClick={() => setA11yOpen(!a11yOpen)} aria-label="Opciones de accesibilidad"
						style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 8, padding: "4px 10px", color: P.textDim, fontSize: "0.58rem", cursor: "pointer", fontFamily: "inherit" }}>
						♿
					</button>
				</div>
			</header>

			{/* A11y bar */}
			{a11yOpen && (
				<nav aria-label="Modos de accesibilidad" style={{ display: "flex", gap: 3, overflowX: "auto", padding: "6px 16px", animation: "fadeIn 0.3s ease" }}>
					{[
						{ id: "normal", label: "Estandar", icon: "👁" },
						{ id: "voice", label: "Solo voz", icon: "🎙" },
						{ id: "text", label: "Solo texto", icon: "💬" },
						{ id: "large", label: "Grande", icon: "🔍" },
						{ id: "signs", label: "Senas", icon: "🤟" },
					].map(m => (
						<button key={m.id} onClick={() => { setAccessMode(m.id); setA11yOpen(false); localStorage.setItem("odi_a11y_mode", m.id); }}
							aria-pressed={accessMode === m.id}
							style={{
								background: accessMode === m.id ? `${P.glow}15` : "transparent",
								border: `1px solid ${accessMode === m.id ? P.glow + "55" : P.border}`,
								borderRadius: 8, padding: "4px 10px",
								color: accessMode === m.id ? P.glow : P.textDim,
								fontSize: "0.58rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
								display: "flex", alignItems: "center", gap: 4,
							}}>
							<span aria-hidden>{m.icon}</span> {m.label}
						</button>
					))}
				</nav>
			)}

			{/* Main */}
			<main role="main" aria-label="Conversacion con ODI" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: hasConvo ? "flex-start" : "center", padding: "0 16px", transition: "all 0.6s ease" }}>
				{/* Orb */}
				<div style={{
					transition: "all 0.9s cubic-bezier(0.22, 0.61, 0.36, 1)",
					transform: hasConvo ? "scale(0.3)" : phase === "doors" ? "scale(1.08)" : "scale(1)",
					marginBottom: hasConvo ? -16 : 20,
					marginTop: hasConvo ? 4 : 0,
				}}>
					<button onClick={() => { if (phase === "habitat") { if (accessMode === "voice") tapToListen(); else inputRef.current?.focus(); } }}
						aria-label="ODI" tabIndex={0}
						style={{
							width: 150, height: 150, borderRadius: "50%",
							background: `radial-gradient(circle at 48% 38%, ${orbColor}dd 0%, ${orbColor}88 28%, ${orbColor}44 52%, ${orbColor}11 75%, transparent 100%)`,
							boxShadow: `0 0 52px ${orbColor}44, inset 0 0 45px ${orbColor}22`,
							border: "none", cursor: "pointer",
							animation: isSpeaking ? "orbSpeak 1.2s ease-in-out infinite" : phase === "greeting" ? "orbLanding 3s ease-in-out infinite" : isSending ? "orbSpeak 2s ease-in-out infinite" : "orbBreathe 4s ease-in-out infinite",
							transition: "background 1.5s ease, box-shadow 1.5s ease",
						}}
					/>
				</div>

				{/* Greeting + Doors */}
				{(phase === "greeting" || phase === "doors") && (
					<div style={{ textAlign: "center", animation: "fadeIn 0.6s ease" }}>
						{msgs.length === 0 && <p style={{ fontSize: "0.62rem", color: P.textFaint }}>...</p>}
						{msgs.map((m, i) => (
							<div key={i} style={{ animation: "fadeIn 0.6s ease" }}>
								<VoiceTag voice={m.voice} />
								<p style={{ margin: "4px 0", fontSize: "1.05rem", fontWeight: 500, color: P.text }}>{m.text}</p>
							</div>
						))}
						{phase === "doors" && (
							<div style={{ marginTop: 28, display: "flex", gap: 16, justifyContent: "center", animation: "fadeIn 0.8s ease" }}>
								{[
									{ icon: "🎙", label: "Voz", mode: "voice" as const },
									{ icon: "⌨", label: "Texto", mode: "text" as const },
									{ icon: "🤟", label: "Señas", mode: "signs" as const },
								].map(door => (
									<button key={door.mode} onClick={() => {
										setAccessMode(door.mode === "signs" ? "signs" : door.mode === "text" ? "text" : "voice");
										localStorage.setItem("odi_a11y_mode", door.mode);
										setPhase("habitat");
										if (door.mode === "voice") setTimeout(() => startContinuousListen(true), 800);
									}}
										style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 12, color: P.textDim, fontSize: "0.65rem", cursor: "pointer", fontFamily: "inherit", padding: "12px 18px", transition: "all 0.3s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
										onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = P.glow + "55"; (e.target as HTMLElement).style.color = P.textSoft; }}
										onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = P.border; (e.target as HTMLElement).style.color = P.textDim; }}
									>
										<span style={{ fontSize: "1.3rem" }}>{door.icon}</span>
										{door.label}
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Ephemeral window — APARECE, CUMPLE, SE DESVANECE */}
				<EphemeralWindow ephemeral={ephemeral} products={ephProducts} onDismiss={() => setEphemeral(null)} />

				{/* Registration prompt — progresivo HER */}
				{regPrompt && (
					<RegistrationPrompt
						prompt={regPrompt}
						onAccept={() => {
							saveReg({ [regPrompt.type]: true });
							setRegPrompt(null);
						}}
						onSkip={() => {
							saveReg({ dismissed: { [regPrompt.type]: true } });
							setRegPrompt(null);
						}}
					/>
				)}

				{/* Habitat — conversation */}
				{phase === "habitat" && hasConvo && (
					<div ref={scrollRef} id="odi-conversation" role="log" aria-live="polite"
						style={{ flex: 1, width: "100%", maxWidth: 620, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "4px 0 16px" }}>
						{msgs.map((m, i) => <Bubble key={i} data={m} isODI={m.role === "odi"} />)}
						{/* 5C-B2 · Panel de review de transcript · firma jdamg-2026-06-13-stt-transcript-review-before-chat-v1 */}
						{pendingReview && (
							<div role="region" aria-label="Revisar transcript" style={{
								background: `${P.spirit}15`, border: `1px solid ${P.spirit}55`,
								borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10,
								maxWidth: "90%", alignSelf: "flex-start",
							}}>
								<div style={{ fontSize: "0.78rem", color: P.text, fontWeight: 600 }}>
									Escuché esto y quiero confirmar contigo antes de enviarlo al Hábitat.
								</div>
								<div style={{ fontSize: "0.74rem", color: P.textSoft, lineHeight: 1.5 }}>
									<div style={{ color: P.textFaint, marginBottom: 2 }}>Texto crudo:</div>
									<div style={{ fontStyle: "italic" }}>"{pendingReview.normResult.stt_text_raw}"</div>
									{pendingReview.normResult.normalization_applied && (
										<>
											<div style={{ color: P.textFaint, marginTop: 6, marginBottom: 2 }}>Lo normalicé como:</div>
											<div style={{ fontStyle: "italic" }}>"{pendingReview.normResult.normalized_text}"</div>
										</>
									)}
								</div>
								<input
									type="text"
									value={pendingReview.editing}
									onChange={e => setPendingReview(prev => prev ? { ...prev, editing: e.target.value } : prev)}
									aria-label="Editar transcript antes de enviar"
									style={{
										fontSize: "0.78rem", padding: "8px 10px",
										background: "rgba(6,13,24,0.6)", border: `1px solid ${P.border}`,
										borderRadius: 8, color: P.text, outline: "none", fontFamily: "inherit",
									}}
								/>
								<div style={{ fontSize: "0.62rem", color: P.textFaint, fontStyle: "italic" }}>
									Confirmar no es firma. No crearé tareas ni ejecutaré acciones por esta confirmación.
								</div>
								<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
									<button onClick={() => dispatchAfterReview("confirmed", pendingReview.normResult.normalization_applied ? pendingReview.normResult.normalized_text : pendingReview.normResult.stt_text_raw)}
										style={{ fontSize: "0.72rem", padding: "8px 14px", background: P.alive, color: "#06121d", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
										Confirmar
									</button>
									<button onClick={() => dispatchAfterReview("edited", pendingReview.editing)}
										style={{ fontSize: "0.72rem", padding: "8px 14px", background: "transparent", color: P.text, border: `1px solid ${P.spirit}66`, borderRadius: 8, cursor: "pointer" }}>
										Enviar texto editado
									</button>
									<button onClick={() => dispatchAfterReview("cancelled", "")}
										style={{ fontSize: "0.72rem", padding: "8px 14px", background: "transparent", color: P.textDim, border: `1px solid ${P.textFaint}33`, borderRadius: 8, cursor: "pointer" }}>
										Cancelar
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</main>

			{/* Voice mode — permanent mic indicator */}
			{phase === "habitat" && accessMode === "voice" && (
				<footer style={{ padding: "10px 16px 20px", display: "flex", justifyContent: "center" }}>
					<button onClick={() => { if (isListening) { try { recognitionRef.current?.stop(); } catch {} } else startContinuousListen(true); }}
						aria-label={isListening ? "Mic activo — escuchando" : "Activar mic"}
						style={{
							width: 52, height: 52, borderRadius: "50%",
							background: isListening ? `${P.spirit}18` : `${P.textFaint}15`,
							border: `2px solid ${isListening ? P.spirit + "55" : P.textFaint + "33"}`,
							cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
							fontSize: "1.3rem", transition: "all 0.3s",
							animation: isListening ? "pulse 2s infinite" : "none",
							boxShadow: isListening ? `0 0 20px ${P.spirit}33` : "none",
						}}>🎙</button>
				</footer>
			)}
			{/* Input — text/normal modes */}
			{phase === "habitat" && accessMode !== "voice" && (
				<footer role="contentinfo" style={{ padding: "10px 16px 20px", maxWidth: 620, width: "100%", margin: "0 auto" }}>
					<div style={{
						display: "flex", alignItems: "center",
						background: P.glass, border: `1px solid ${P.border}`,
						borderRadius: 14, padding: "3px 3px 3px 14px",
						backdropFilter: "blur(10px)",
					}}>
						<input ref={inputRef} type="text" value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={e => e.key === "Enter" && send()}
							placeholder="..." autoComplete="off" aria-label="Escribe a ODI"
							disabled={isSending}
							style={{ flex: 1, background: "transparent", border: "none", color: P.text, fontSize: "0.86rem", outline: "none", fontFamily: "inherit", padding: "10px 0" }}
						/>
						{accessMode !== "text" && accessMode !== "signs" && (
							<button onClick={tapToListen}
								aria-label={isListening ? "Escuchando..." : "Toca para hablar"}
								style={{
									width: 36, height: 36, borderRadius: 10, marginRight: 4,
									background: isListening ? `${P.spirit}15` : "transparent",
									border: `1px solid ${isListening ? P.spirit + "33" : P.border}`,
									cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
									color: isListening ? P.spirit : P.textDim, fontSize: "0.9rem",
									animation: isListening ? "pulse 1.5s infinite" : "none",
								}}>🎙</button>
						)}
						<button onClick={send} disabled={!input.trim() || isSending} aria-label="Enviar"
							style={{
								width: 36, height: 36, borderRadius: 10,
								background: input.trim() ? orbColor : "transparent",
								border: "none", cursor: input.trim() ? "pointer" : "default",
								display: "flex", alignItems: "center", justifyContent: "center",
								opacity: input.trim() ? 1 : 0.2, transition: "all 0.25s",
							}}>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? P.void : P.textDim} strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
						</button>
					</div>
				</footer>
			)}

			<style>{`
				@keyframes orbBreathe { 0%{transform:translateY(0) scale(1);filter:brightness(1)} 25%{transform:translateY(-8px) scale(1.04);filter:brightness(1.08)} 50%{transform:translateY(-2px) scale(1.02);filter:brightness(1.12)} 75%{transform:translateY(-6px) scale(0.98);filter:brightness(0.97)} 100%{transform:translateY(0) scale(1);filter:brightness(1)} }
				@keyframes orbSpeak { 0%{transform:translateY(0) scale(1);filter:brightness(1.1)} 25%{transform:translateY(-12px) scale(1.15);filter:brightness(1.3)} 50%{transform:translateY(-4px) scale(1.08);filter:brightness(1.15)} 75%{transform:translateY(-10px) scale(1.12);filter:brightness(1.25)} 100%{transform:translateY(0) scale(1);filter:brightness(1.1)} }
					@keyframes orbLanding { 0%{transform:translateY(0) scale(1)} 33%{transform:translateY(-15px) scale(1.06)} 66%{transform:translateY(-5px) scale(1.03)} 100%{transform:translateY(0) scale(1)} }
				@keyframes fadeIn { from{opacity:0}to{opacity:1} }
			@keyframes fadeOut { from{opacity:1}to{opacity:0} }
				@keyframes msgIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
				@keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(196,160,255,0.4)} 70%{box-shadow:0 0 0 12px rgba(196,160,255,0)} 100%{box-shadow:0 0 0 0 rgba(196,160,255,0)} }
				*{box-sizing:border-box;margin:0}
				::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${P.textFaint};border-radius:2px}
				::placeholder{color:${P.textDim}}
			`}</style>
		</div>
	);
}
