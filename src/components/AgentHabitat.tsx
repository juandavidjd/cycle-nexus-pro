"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──
interface AgentEvent {
	event_id: string;
	ts: string;
	source: string;
	type: string;
	level?: string;
	voice?: string;
	mode?: string;
	payload?: { text?: string; [k: string]: unknown };
	system_action?: { type?: string; status?: string; [k: string]: unknown };
}

type Phase = "idle" | "connecting" | "registering" | "live" | "offline";
type InputMode = "text" | "voice" | "signs";
type SideTab = "flows" | "manifest" | "stats" | "events" | "domains";

// ── Constants ──
const WS_URLS = [
	"wss://ws.liveodi.com",
	"wss://api.liveodi.com/ws/vivir",
	"ws://localhost:8765",
];
const AGENT_API = "https://ws.liveodi.com/agent";
const CHAT_URL = "https://api.liveodi.com/odi/chat";
const SPEAK_URL = "https://api.liveodi.com/odi/chat/speak";
const HEARTBEAT_MS = 12_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;
const MAX_EVENTS = 60;

const SOURCE_COLORS: Record<string, string> = {
	agent: "#49c2ff", chat: "#3af08f", pipeline: "#ffcc00",
	test: "#c084fc", radar: "#f97316", webops: "#06b6d4",
	voice: "#ec4899", flow: "#a78bfa",
	whatsapp: "#25D366", manager: "#ff9800",
	turismo: "#ff7043", lead: "#26a69a",
	ces: "#ef5350", billing: "#4caf50",
	guardian: "#ff9800",
};

const SVC_COLOR: Record<string, string> = {
	alive: "#3af08f", degraded: "#ffcc00", unreachable: "#ff4444",
};

// ── Helpers ──
function getDeviceId(): string {
	if (typeof window === "undefined") return "ssr";
	let id = localStorage.getItem("odi_device_id");
	if (!id) {
		id = `dev_${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
		localStorage.setItem("odi_device_id", id);
	}
	return id;
}

function isReturn(): boolean {
	if (typeof window === "undefined") return false;
	return !!localStorage.getItem("odi_device_id");
}

function timeAgo(iso: string): string {
	const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 5) return "ahora";
	if (s < 60) return `${s}s`;
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	return `${Math.floor(s / 3600)}h`;
}

// ── Blindaje helpers ──
const STATUS_COLORS: Record<string, string> = {
	operativo: "#3af08f", active: "#3af08f", degraded: "#ffcc00",
	timeout: "#ff9800", unavailable: "#ff4444", missing: "#4a5f7f",
};

function FreshnessTag({ data }: { data: any }) {
	if (!data?._fetched_at) return null;
	const status = data?.status || "missing";
	const color = STATUS_COLORS[status] || "#4a5f7f";
	const isOk = status === "operativo" || status === "active";
	return (
		<span className="text-[8px] ml-auto" style={{ color }}>
			{isOk ? timeAgo(data._fetched_at) : status}
		</span>
	);
}

function DegradedCard({ name, data }: { name: string; data: any }) {
	const status = data?.status || "unavailable";
	const error = data?._error || "";
	return (
		<div className="rounded-lg p-3 border-2 border-[#ff444466] animate-pulse" style={{ background: "#ff444418" }}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<span className="text-sm">&#x26A0;</span>
					<span className="text-xs font-bold text-[#ff4444]">{name}</span>
					<span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff444430] text-[#ff4444] font-semibold">{status}</span>
				</div>
				{data?._fetched_at && <span className="text-[8px] text-[#ff8888]">{timeAgo(data._fetched_at)}</span>}
			</div>
			{error && <div className="text-[9px] text-[#ff6666] mt-1">{error.slice(0, 80)}</div>}
		</div>
	);
}

// ── Component ──
export function AgentHabitat() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [events, setEvents] = useState<AgentEvent[]>([]);
	const [returnVisit] = useState(isReturn);
	const [heartbeats, setHeartbeats] = useState(0);
	const [wsUrlIdx, setWsUrlIdx] = useState(0);
	const [inputMode, setInputMode_] = useState<InputMode>("text");
	const setInputMode = useCallback((m: InputMode) => {
		setInputMode_(m); inputModeRef.current = m;
		if (typeof window !== "undefined") localStorage.setItem("odi_input_mode", m);
	}, []);
	// Restore persisted mode on mount
	useEffect(() => {
		if (typeof window === "undefined") return;
		const saved = localStorage.getItem("odi_input_mode");
		if (saved === "voice" || saved === "text") { setInputMode_(saved); inputModeRef.current = saved; }
	}, []);
	const [chatInput, setChatInput] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [showSidebar, setShowSidebar] = useState(true);
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);
	const [sideTab, setSideTab] = useState<SideTab>("manifest");

	// ── Live data from backend (with localStorage cache) ──
	const [liveManifest, setLiveManifest] = useState<any>(() => {
		if (typeof window === "undefined") return null;
		try { const c = localStorage.getItem("odi_cache_manifest"); return c ? JSON.parse(c) : null; } catch { return null; }
	});
	const [flows, setFlows] = useState<any[]>(() => {
		if (typeof window === "undefined") return [];
		try { const c = localStorage.getItem("odi_cache_flows"); return c ? JSON.parse(c) : []; } catch { return []; }
	});
	const [categories, setCategories] = useState<any[]>(() => {
		if (typeof window === "undefined") return [];
		try { const c = localStorage.getItem("odi_cache_categories"); return c ? JSON.parse(c) : []; } catch { return []; }
	});
	const [stats, setStats] = useState<any>(() => {
		if (typeof window === "undefined") return null;
		try { const c = localStorage.getItem("odi_cache_stats"); return c ? JSON.parse(c) : null; } catch { return null; }
	});

	// ── Domains + Events ──
	const [domains, setDomains] = useState<any>(null);
	const [recentEvents, setRecentEvents] = useState<any[]>([]);

	// ── Stores ──
	const [stores, setStores] = useState<any[]>(() => {
		if (typeof window === "undefined") return [];
		try { const c = localStorage.getItem("odi_cache_stores"); return c ? JSON.parse(c) : []; } catch { return []; }
	});
	const [panelLoading, setPanelLoading] = useState(!liveManifest);

	// ── Accessibility ──
	const [showAdaptarme, setShowAdaptarme] = useState(false);
	const [a11yPrefs, setA11yPrefs] = useState(() => {
		if (typeof window === "undefined") return { textSize: "normal", contrast: "normal", simplified: false };
		try { const c = localStorage.getItem("odi_a11y"); return c ? JSON.parse(c) : { textSize: "normal", contrast: "normal", simplified: false }; } catch { return { textSize: "normal", contrast: "normal", simplified: false }; }
	});
	const updateA11y = useCallback((patch: any) => {
		setA11yPrefs((prev: any) => {
			const next = { ...prev, ...patch };
			try { localStorage.setItem("odi_a11y", JSON.stringify(next)); } catch {}
			return next;
		});
	}, []);

	// ── Return card ──
	const [returnContext, setReturnContext] = useState<any>(null);
	const [showReturnCard, setShowReturnCard] = useState(false);

	// ── Flow player ──
	const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
	const [activeFlowMeta, setActiveFlowMeta] = useState<any>(null);
	const [activeFlowSeq, setActiveFlowSeq] = useState<any[]>([]);
	const [activeFlowStep, setActiveFlowStep] = useState(0);

	const wsRef = useRef<WebSocket | null>(null);
	const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const reconRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const reconAttemptsRef = useRef(0);
	const sessionRef = useRef(
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `sess_${Date.now().toString(36)}`
	);
	const deviceRef = useRef("ssr");
	const mountedRef = useRef(true);
	const urlIdxRef = useRef(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const lastManifestRef = useRef("");

	// ── pushEvent (with dedup) ──
	const pushEvent = useCallback((ev: AgentEvent) => {
		setEvents((prev) => {
			// Dedup: reject if same source + text within last 5 seconds
			const txt = ev.payload?.text;
			if (txt && prev.length > 0) {
				const recent = prev[0];
				if (recent.source === ev.source && recent.payload?.text === txt) {
					const gap = new Date(ev.ts).getTime() - new Date(recent.ts).getTime();
					if (Math.abs(gap) < 5000) return prev;
				}
			}
			return [ev, ...prev].slice(0, MAX_EVENTS);
		});
	}, []);

	const cleanup = useCallback(() => {
		if (hbRef.current) clearInterval(hbRef.current);
		if (reconRef.current) clearTimeout(reconRef.current);
		hbRef.current = null;
		reconRef.current = null;
	}, []);

	// === Autoplay gate (persistent per session) ===
	const [userHasInteracted, setUserHasInteracted] = useState(false);
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (sessionStorage.getItem("odi_audio_unlocked") === "true") {
			setUserHasInteracted(true);
			return;
		}
		const unlock = () => {
			setUserHasInteracted(true);
			sessionStorage.setItem("odi_audio_unlocked", "true");
		};
		window.addEventListener("pointerdown", unlock, { once: true });
		window.addEventListener("keydown", unlock, { once: true });
		return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
	}, []);

	// === TTS ===
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const isPlayingRef = useRef(false);
	const [isSpeaking, setIsSpeaking] = useState(false);

	const speakText = useCallback(async (text: string, voice: string = "ramona") => {
		if (!userHasInteracted || isPlayingRef.current || !text) return;
		const truncated = text.length > 500 ? text.slice(0, 497) + "..." : text;
		// OC-07 R3: Transition to ASSISTANT_SPEAKING
		turnStateRef.current = "ASSISTANT_SPEAKING";
		// Track what ODI says for anti-echo filter
		recentOdiPhrasesRef.current = [...recentOdiPhrasesRef.current.slice(-5), truncated.toLowerCase()];
		lastAssistantTextRef.current = truncated.toLowerCase();
		lastAssistantTsRef.current = Date.now();
		// Echo prevention: pause STT while speaking
		const wasListening = !!recognitionRef.current;
		if (wasListening) { try { recognitionRef.current?.stop(); setIsListening(false); } catch {} }
		// Cleanup previous audio
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.onended = null;
			audioRef.current.onerror = null;
			audioRef.current.src = "";
		}
		isPlayingRef.current = false;
		try {
			setIsSpeaking(true);
			isPlayingRef.current = true;
			const resp = await fetch(SPEAK_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: truncated, voice }),
			});
			if (resp.ok) {
				const blob = await resp.blob();
				const url = URL.createObjectURL(blob);
				const audio = audioRef.current || new Audio();
				audioRef.current = audio;
				audio.onended = () => {
					isPlayingRef.current = false; setIsSpeaking(false); URL.revokeObjectURL(url);
					// OC-07 R1+R3: COOLDOWN before reopening mic
					turnStateRef.current = "COOLDOWN";
					if (inputModeRef.current === "voice" && wasListening) {
						setTimeout(() => {
							if (!isPlayingRef.current && turnStateRef.current === "COOLDOWN") {
								turnStateRef.current = "USER_IDLE";
								try { recognitionRef.current?.start(); setIsListening(true); } catch {}
							}
						}, COOLDOWN_MS);
					} else {
						setTimeout(() => { turnStateRef.current = "USER_IDLE"; }, COOLDOWN_MS);
					}
				};
				audio.onerror = () => {
					isPlayingRef.current = false; setIsSpeaking(false);
					turnStateRef.current = "COOLDOWN";
					if (inputModeRef.current === "voice" && wasListening) {
						setTimeout(() => {
							if (!isPlayingRef.current && turnStateRef.current === "COOLDOWN") {
								turnStateRef.current = "USER_IDLE";
								try { recognitionRef.current?.start(); setIsListening(true); } catch {}
							}
						}, COOLDOWN_MS);
					} else {
						setTimeout(() => { turnStateRef.current = "USER_IDLE"; }, COOLDOWN_MS);
					}
				};
				audio.src = url;
				await audio.play();
			} else { isPlayingRef.current = false; setIsSpeaking(false); }
		} catch { isPlayingRef.current = false; setIsSpeaking(false); }
	}, [userHasInteracted]);

	// === STT ===
	const recognitionRef = useRef<any>(null);
	const [isListening, setIsListening] = useState(false);
	const [interimText, setInterimText] = useState("");
	const greetKey = `odi_greeted_${sessionRef.current}`;
	const hasGreetedRef = useRef(typeof window !== "undefined" && sessionStorage.getItem(`odi_greeted_${sessionRef.current}`) === "true");
	const recentOdiPhrasesRef = useRef<string[]>([]);
	const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inputModeRef = useRef<InputMode>("text");

	// === OC-07 R3: Turn state machine ===
	type TurnState = "USER_IDLE" | "USER_SPEAKING" | "ASSISTANT_THINKING" | "ASSISTANT_SPEAKING" | "COOLDOWN";
	const turnStateRef = useRef<TurnState>("USER_IDLE");
	const lastAssistantTextRef = useRef("");
	const lastAssistantTsRef = useRef(0);
	const COOLDOWN_MS = 700;
	const latestTextRef = useRef("");

	const handleSend = useCallback(async (text?: string) => {
		const msg = (text || chatInput).trim();
		if (!msg || isSending) return;
		// OC-07 R3: Block input during ASSISTANT_SPEAKING and COOLDOWN
		if (turnStateRef.current === "ASSISTANT_SPEAKING" || turnStateRef.current === "COOLDOWN") return;
		// OC-07 R2: N-gram echo guard (frontend layer)
		const elapsed = Date.now() - lastAssistantTsRef.current;
		if (elapsed < 3000 && lastAssistantTextRef.current) {
			const ngram = (s: string, n: number = 3) => {
				const w = s.toLowerCase().replace(/[^a-záéíóúñü\s]/gi, "").split(/\s+/).filter(Boolean);
				const grams = new Set<string>();
				for (let i = 0; i <= w.length - n; i++) grams.add(w.slice(i, i + n).join(" "));
				return grams;
			};
			const userNg = ngram(msg);
			const odiNg = ngram(lastAssistantTextRef.current);
			if (odiNg.size > 0 && userNg.size > 0) {
				let overlap = 0;
				userNg.forEach(g => { if (odiNg.has(g)) overlap++; });
				if (overlap / odiNg.size > 0.5) return; // echo detected, discard silently
			}
		}
		turnStateRef.current = "ASSISTANT_THINKING";
		setChatInput("");
		setIsSending(true);
		pushEvent({ event_id: `user_${Date.now()}`, ts: new Date().toISOString(), source: "agent", type: "user_message", payload: { text: msg } });
		try {
			const resp = await fetch(CHAT_URL, {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: msg, mode: "commerce", session_id: sessionRef.current }),
			});
			if (resp.ok) {
				const data = await resp.json();
				const responseText = data.response || "";
				const voice = data.voice || "ramona";
				pushEvent({ event_id: `chat_${Date.now()}`, ts: new Date().toISOString(), source: "chat", type: "message", voice, mode: data.mode || "commerce", payload: { text: responseText } });
				if (inputModeRef.current === "voice" && responseText) {
					speakText(responseText, voice); // speakText sets ASSISTANT_SPEAKING
				} else {
					turnStateRef.current = "USER_IDLE"; // text mode: ready for next input
				}
			} else {
				turnStateRef.current = "USER_IDLE";
			}
		} catch {
			pushEvent({ event_id: `err_${Date.now()}`, ts: new Date().toISOString(), source: "agent", type: "error", payload: { text: "No pude conectar con el chat" } });
			turnStateRef.current = "USER_IDLE";
		}
		setIsSending(false);
	}, [chatInput, isSending, inputMode, pushEvent, speakText]);

	const resetIdleTimer = useCallback(() => {
		if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
		// idle_push disabled until echo prevention is stable
	}, []);

	const startContinuousListening = useCallback(() => {
		const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SR) {
			pushEvent({ event_id: `nostt_${Date.now()}`, ts: new Date().toISOString(), source: "agent", type: "state_change", payload: { text: "Tu navegador no soporta voz. Usa texto." }, system_action: { type: "voice_unsupported" } });
			setInputMode("text");
			return;
		}
		const recognition = new SR();
		recognition.lang = "es-CO";
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.onresult = (event: any) => {
			// OC-07 R1+R3: Block STT results during TTS or cooldown
			if (isPlayingRef.current || turnStateRef.current === "ASSISTANT_SPEAKING" || turnStateRef.current === "COOLDOWN") return;
			// Get the latest result only (last in array)
			const last = event.results[event.results.length - 1];
			if (!last) return;
			const text = last[0].transcript.trim();
			if (last.isFinal) {
				latestTextRef.current = text;
				setInterimText(text);
			} else {
				// Interim: show as preview but use latest final if exists
				setInterimText(latestTextRef.current ? latestTextRef.current + " " + text : text);
			}
			// Silence timer: 2.5s after last activity, send and restart recognition
			if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
			silenceTimerRef.current = setTimeout(() => {
				if (isPlayingRef.current || turnStateRef.current === "ASSISTANT_SPEAKING" || turnStateRef.current === "COOLDOWN") return;
				const t = latestTextRef.current || text;
				latestTextRef.current = "";
				if (!t || t.length < 3) { setInterimText(""); return; }
				// Anti-echo
				const lower = t.toLowerCase();
				const isEcho = recentOdiPhrasesRef.current.some(p => {
					const a = p.replace(/[^a-záéíóúñü\s]/gi, "").trim();
					const b = lower.replace(/[^a-záéíóúñü\s]/gi, "").trim();
					return a && b && (a.includes(b) || b.includes(a));
				});
				if (isEcho) { setInterimText(""); return; }
				handleSend(t);
				setInterimText("");
				// Stop recognition to clear results array, onend will restart
				try { recognition.stop(); } catch {}
			}, 1800);
		};
		recognition.onend = () => {
			// NEVER auto-restart while TTS is playing
			if (isPlayingRef.current) { setIsListening(false); return; }
			if (inputModeRef.current === "voice") {
				// Delay restart to avoid rapid start/stop chime on mobile
				setTimeout(() => {
					if (inputModeRef.current === "voice" && !isPlayingRef.current) {
						try { recognition.start(); } catch {}
					}
				}, 1000);
			} else { setIsListening(false); }
		};
		recognition.onerror = (e: any) => {
			if (e.error === "not-allowed") {
				pushEvent({ event_id: `mic_${Date.now()}`, ts: new Date().toISOString(), source: "agent", type: "state_change", payload: { text: "Necesito permiso de micrófono para escucharte." }, system_action: { type: "mic_denied" } });
				setInputMode("text");
			}
			// no-speech: silently handled by onend restart — no action needed
		};
		try { recognition.start(); recognitionRef.current = recognition; setIsListening(true); resetIdleTimer(); } catch {}
	}, [handleSend, pushEvent, setInputMode, resetIdleTimer]);

	const stopContinuousListening = useCallback(() => {
		if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
		if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
		try { recognitionRef.current?.stop(); } catch {}
		recognitionRef.current = null;
		setIsListening(false);
		setInterimText("");
	}, []);

	// === OC-05: Ctrl+M toggle mic without touch (Accesibilidad J3) ===
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "m") {
				e.preventDefault();
				if (inputModeRef.current === "voice") {
					stopContinuousListening();
					setInputMode("text");
				} else {
					setInputMode("voice");
					startContinuousListening();
				}
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [startContinuousListening, stopContinuousListening, setInputMode]);

	// === OC-05: Wake word "ODI" — passive listener in text mode ===
	const wakeRecRef = useRef<any>(null);
	useEffect(() => {
		if (!userHasInteracted) return;
		const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SR) return;
		if (inputMode === "voice") {
			if (wakeRecRef.current) { try { wakeRecRef.current.stop(); } catch {} wakeRecRef.current = null; }
			return;
		}
		const wake = new SR();
		wake.lang = "es-CO";
		wake.continuous = true;
		wake.interimResults = false;
		wake.onresult = (event: any) => {
			const last = event.results[event.results.length - 1];
			if (!last.isFinal) return;
			const transcript = last[0].transcript.trim().toLowerCase()
				.replace(/\bo\s*d\s*i\b/gi, "odi")
				.replace(/\b(oye|hoy|ody|oh di|od i|odie|o de i)\b/gi, "odi");
			if (transcript.startsWith("odi")) {
				const command = transcript.replace(/^odi\s*/, "").trim();
				try { wake.stop(); } catch {}
				wakeRecRef.current = null;
				setInputMode("voice");
				startContinuousListening();
				if (command) handleSend(command);
			}
		};
		wake.onend = () => {
			if (inputModeRef.current !== "voice" && wakeRecRef.current) {
				setTimeout(() => { try { wake.start(); } catch {} }, 500);
			}
		};
		wake.onerror = (e: any) => {
			if (e.error === "not-allowed" || e.error === "service-not-allowed") {
				wakeRecRef.current = null;
				return;
			}
		};
		try { wake.start(); wakeRecRef.current = wake; } catch {}
		return () => { try { wake.stop(); } catch {} wakeRecRef.current = null; };
	}, [userHasInteracted, inputMode, startContinuousListening, setInputMode, handleSend]);

	// === Cached fetch helper ===
	const cachedFetch = useCallback(async (url: string, cacheKey: string, setter: (d: any) => void, transform?: (d: any) => any) => {
		try {
			const ctrl = new AbortController();
			const timeout = setTimeout(() => ctrl.abort(), 8000);
			const r = await fetch(url, { signal: ctrl.signal });
			clearTimeout(timeout);
			if (r.ok) {
				const d = await r.json();
				const val = transform ? transform(d) : d;
				setter(val);
				try { localStorage.setItem(cacheKey, JSON.stringify(val)); } catch {}
			}
		} catch {}
	}, []);

	// === Load live manifest ===
	useEffect(() => {
		const load = () => cachedFetch(`${AGENT_API}/manifest`, "odi_cache_manifest", (d) => { setLiveManifest(d); setPanelLoading(false); });
		load();
		const iv = setInterval(load, 30000);
		return () => clearInterval(iv);
	}, [cachedFetch]);

	// === Load flows ===
	useEffect(() => {
		cachedFetch(`${AGENT_API}/flows`, "odi_cache_flows", setFlows, (d) => {
			setCategories(d.categories || []);
			try { localStorage.setItem("odi_cache_categories", JSON.stringify(d.categories || [])); } catch {}
			return d.flows || [];
		});
	}, [cachedFetch]);

	// === Load stats ===
	useEffect(() => {
		const load = () => cachedFetch(`${AGENT_API}/stats`, "odi_cache_stats", setStats);
		load();
		const iv = setInterval(load, 60000);
		return () => clearInterval(iv);
	}, [cachedFetch]);

	// === Load stores ===
	useEffect(() => {
		const load = () => cachedFetch(`${AGENT_API}/stores`, "odi_cache_stores", setStores, (d) => d.stores || []);
		load();
		const iv = setInterval(load, 60000);
		return () => clearInterval(iv);
	}, [cachedFetch]);

	// === Load domains ===
	useEffect(() => {
		cachedFetch(`${AGENT_API}/domains`, "odi_cache_domains", setDomains);
	}, [cachedFetch]);

	// === Load recent events ===
	useEffect(() => {
		const load = () => cachedFetch(`${AGENT_API}/events/recent`, "odi_cache_events", setRecentEvents, (d) => d.events || []);
		load();
		const iv = setInterval(load, 30000);
		return () => clearInterval(iv);
	}, [cachedFetch]);

	// === Flow player ===
	const startFlow = useCallback(async (flowId: string) => {
		try {
			const [seqR, flowR] = await Promise.all([
				fetch(`${AGENT_API}/flows/${flowId}/sequence`),
				fetch(`${AGENT_API}/flows/${flowId}`),
			]);
			if (!seqR.ok) return;
			const seqData = await seqR.json();
			const flowData = flowR.ok ? await flowR.json() : null;
			setActiveFlowId(flowId);
			setActiveFlowMeta(flowData);
			setActiveFlowSeq(seqData.steps || []);
			setActiveFlowStep(0);
			fetch(`${AGENT_API}/flows/${flowId}/start`, {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ session_id: sessionRef.current }),
			}).catch(() => {});
		} catch {}
	}, []);

	const advanceFlow = useCallback(() => {
		if (!activeFlowId || activeFlowStep >= activeFlowSeq.length - 1) {
			setActiveFlowId(null); setActiveFlowSeq([]); setActiveFlowStep(0); setActiveFlowMeta(null);
			return;
		}
		const next = activeFlowStep + 1;
		setActiveFlowStep(next);
		fetch(`${AGENT_API}/flows/${activeFlowId}/step`, {
			method: "POST", headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ session_id: sessionRef.current }),
		}).catch(() => {});
		const step = activeFlowSeq[next];
		if (step?.voice && inputMode === "voice") speakText(step.text, step.voice);
	}, [activeFlowId, activeFlowStep, activeFlowSeq, inputMode, speakText]);

	const closeFlow = useCallback(() => {
		setActiveFlowId(null); setActiveFlowSeq([]); setActiveFlowStep(0); setActiveFlowMeta(null);
	}, []);

	const dismissFlow = useCallback(async (flowId: string) => {
		try {
			await fetch(`${AGENT_API}/flows/${flowId}/dismiss`, {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ device_id: deviceRef.current }),
			});
		} catch {}
	}, []);

	const startFlowFromStep = useCallback(async (flowId: string, fromStep: number) => {
		try {
			const [seqR, flowR] = await Promise.all([
				fetch(`${AGENT_API}/flows/${flowId}/sequence`),
				fetch(`${AGENT_API}/flows/${flowId}`),
			]);
			if (!seqR.ok) return;
			const seqData = await seqR.json();
			const flowData = flowR.ok ? await flowR.json() : null;
			setActiveFlowId(flowId);
			setActiveFlowMeta(flowData);
			setActiveFlowSeq(seqData.steps || []);
			setActiveFlowStep(fromStep);
		} catch {}
	}, []);

	// === WS connect ===
	const connect = useCallback(() => {
		cleanup();
		if (!mountedRef.current) return;
		const url = WS_URLS[urlIdxRef.current];
		setPhase("connecting");
		const ws = new WebSocket(url);
		wsRef.current = ws;
		ws.onopen = () => {
			if (!mountedRef.current) { ws.close(); return; }
			reconAttemptsRef.current = 0;
			setPhase("registering"); setWsUrlIdx(urlIdxRef.current);
			ws.send(JSON.stringify({
				type: "register", device_id: deviceRef.current, session_id: sessionRef.current,
				device_info: { platform: navigator.platform || "unknown", language: navigator.language || "es", user_agent: navigator.userAgent, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: { width: window.screen?.width, height: window.screen?.height } },
			}));
			hbRef.current = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "heartbeat" })); }, HEARTBEAT_MS);
		};
		ws.onmessage = (e) => {
			if (!mountedRef.current) return;
			try {
				const msg = JSON.parse(e.data);
				if (msg.type === "manifest") {
					setPhase("live");
					const dedupKey = msg.manifest?.version || msg.ts || "";
					const isDupe = dedupKey && dedupKey === lastManifestRef.current;
					lastManifestRef.current = dedupKey;
					if (!isDupe) {
						pushEvent({ event_id: msg.session_id || "manifest", ts: msg.ts || new Date().toISOString(), source: "agent", type: "manifest", payload: { text: "Manifest recibido" }, system_action: { type: "manifest", status: "Habitat conectado" } });
					}
					// ODI greets — text only, once per session
					if (!hasGreetedRef.current) {
						hasGreetedRef.current = true;
						try { sessionStorage.setItem(greetKey, "true"); } catch {}
						setTimeout(() => {
							pushEvent({ event_id: `greet_${Date.now()}`, ts: new Date().toISOString(), source: "agent", type: "state_change", voice: "ramona", mode: "care", payload: { text: "Hola. Estoy aqu\u00ed." }, system_action: { type: "greeting", status: "\uD83D\uDFE3 Ramona" } });
						}, 800);
						setTimeout(() => {
							pushEvent({ event_id: `greet2_${Date.now()}`, ts: new Date().toISOString(), source: "agent", type: "state_change", voice: "ramona", mode: "care", payload: { text: "\u00bfQu\u00e9 necesitas?" }, system_action: { type: "greeting_follow", status: "\uD83D\uDFE3 Ramona" } });
						}, 3000);
					}
					return;
				}
				if (msg.type === "heartbeat_ack") { setHeartbeats((n) => n + 1); return; }
				// Detect return_detected
				if (msg.system_action?.type === "return_detected" || (msg.type === "state_change" && msg.payload?.resume)) {
					const resume = msg.payload?.resume || msg.payload || {};
					setReturnContext({
						visit_count: resume.visit_count || msg.payload?.text?.match(/#(\d+)/)?.[1] || "?",
						resume_text: resume.resume_text || msg.payload?.text || "Bienvenido de vuelta.",
						identity_depth: resume.identity_depth || "anonymous",
						incomplete_flows: resume.incomplete_flows || [],
						last_flow: resume.last_flow,
						last_step: resume.last_step,
					});
					setShowReturnCard(true);
				}
				pushEvent({ event_id: msg.event_id || `ev_${Date.now()}`, ts: msg.ts || new Date().toISOString(), source: msg.source || "unknown", type: msg.type || "event", level: msg.level, voice: msg.voice, mode: msg.mode, payload: msg.payload, system_action: msg.system_action });
			} catch {}
		};
		ws.onclose = () => { if (!mountedRef.current) return; cleanup(); setPhase("offline"); urlIdxRef.current = (urlIdxRef.current + 1) % WS_URLS.length; const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, reconAttemptsRef.current), RECONNECT_MAX_MS); reconAttemptsRef.current++; reconRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, delay); };
		ws.onerror = () => { ws.close(); };
	}, [cleanup, pushEvent]);

	useEffect(() => {
		mountedRef.current = true; deviceRef.current = getDeviceId(); connect();
		return () => { mountedRef.current = false; cleanup(); stopContinuousListening(); if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
	}, [connect, cleanup]);

	// ── Phase styles ──
	const flameGradient: Record<Phase, string> = {
		idle: "radial-gradient(circle at 50% 35%, #666 0%, #444 50%, transparent 100%)",
		connecting: "radial-gradient(circle at 50% 35%, #ffcc00 0%, #ff8800 50%, transparent 100%)",
		registering: "radial-gradient(circle at 50% 35%, #ffcc00 0%, #ff8800 50%, transparent 100%)",
		live: "radial-gradient(circle at 50% 35%, #9be2ff 0%, #49c2ff 32%, #6f6dff 65%, rgba(111,109,255,0.1) 82%, transparent 100%)",
		offline: "radial-gradient(circle at 50% 35%, #ff4444 0%, #cc0000 50%, transparent 100%)",
	};
	const flameShadow: Record<Phase, string> = { idle: "0 0 20px #44444488", connecting: "0 0 30px #ffcc0088", registering: "0 0 30px #ffcc0088", live: "0 0 38px #4ab8ffaa, inset 0 0 35px #b8d8ff70", offline: "0 0 30px #ff444488" };
	const statusLabel: Record<Phase, string> = { idle: "Esperando...", connecting: "Buscando al organismo...", registering: "Despertando...", live: "Habitat vivo", offline: "Volviendo..." };
	const statusDot: Record<Phase, string> = { idle: "bg-[#444]", connecting: "bg-[#ffcc00] animate-pulse", registering: "bg-[#ffcc00] animate-pulse", live: "bg-[#3af08f] shadow-[0_0_12px_#3af08fcc] animate-pulse", offline: "bg-[#ff4444] animate-pulse" };

	// Group flows by category
	const flowsByCategory: Record<string, any[]> = {};
	flows.forEach((f) => { if (!flowsByCategory[f.category]) flowsByCategory[f.category] = []; flowsByCategory[f.category].push(f); });

	const showDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

	return (
		<main className="min-h-screen bg-[#03070d] text-[#dbe7ff] font-sans" role="main" aria-label="LiveODI Habitat">
			<div className="max-w-[1200px] mx-auto min-h-screen px-4 py-5">

				{/* ── Header ── */}
				<header className="flex items-center justify-between gap-3 mb-4" role="banner">
					<div className="flex items-center gap-3">
						<span className="text-xs tracking-[0.18em] text-[#4a5f7f] font-semibold">ODI PANEL</span>
						<span className="w-2 h-2 rounded-full bg-[#3af08f] shadow-[0_0_8px_#3af08f66]" title="LiveODI activo" />
						{liveManifest && (
							<span className="text-[10px] text-[#4a5f7f]">
								{liveManifest.services_alive}/{liveManifest.services_total} srv · {liveManifest.stores_active || 0} tiendas · {(liveManifest.products_total || 0).toLocaleString()} prod
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<a href="/" className="text-[10px] text-[#49c2ff] hover:text-[#9be2ff]">← Habitat</a>
					</div>
				</header>

				{/* ── Grid ── */}
				<div className="grid gap-6" style={{ gridTemplateColumns: isMobile ? "1fr" : showSidebar ? "180px 1fr 300px" : "180px 1fr" }}>

					{/* ── Flame column ── */}
					<section className={`flex flex-col items-center ${isMobile ? "py-2" : "pt-8"}`}>
						<div role="img" aria-label={`ODI estado: ${phase === "live" ? "activo" : phase}`} className={isMobile ? "w-12 h-12 rounded-full" : "w-28 h-28 rounded-full"} style={{
							background: isSpeaking ? "radial-gradient(circle at 50% 35%, #ec4899 0%, #be185d 40%, #6f6dff 70%, transparent 100%)" : flameGradient[phase],
							boxShadow: isSpeaking ? "0 0 40px #ec489988, inset 0 0 30px #ec489944" : flameShadow[phase],
							animation: phase === "live" ? "breathe 4s ease-in-out infinite" : "none",
							transition: "box-shadow 0.6s, background 0.6s",
						}} />
						{!isMobile && (
							<p className="text-xs text-[#7f95bb] mt-3 text-center">
								{phase === "live" && heartbeats > 0 && `${heartbeats} latidos`}
							</p>
						)}
						{phase === "live" && (
							<>
								<div className={`flex gap-1.5 flex-wrap justify-center ${isMobile ? "mt-1" : "mt-3"}`} role="group" aria-label="Modo de entrada">
									<button aria-label="Activar modo voz" aria-pressed={inputMode === "voice"} onClick={() => { setInputMode("voice"); if (!isListening) startContinuousListening(); }} className={`${isMobile ? "text-xs px-3 py-2" : "text-[10px] px-2.5 py-1.5"} rounded-lg border cursor-pointer transition-all ${inputMode === "voice" ? "bg-[#49c2ff15] border-[#49c2ff44] text-[#dbe7ff]" : "bg-transparent border-[#1a2a42] text-[#4a5f7f] hover:text-[#7f95bb]"}`}>
										🎙 Voz
									</button>
									<button aria-label="Activar modo texto" aria-pressed={inputMode === "text"} onClick={() => { stopContinuousListening(); setInputMode("text"); }} className={`${isMobile ? "text-xs px-3 py-2" : "text-[10px] px-2.5 py-1.5"} rounded-lg border cursor-pointer transition-all ${inputMode === "text" ? "bg-[#49c2ff15] border-[#49c2ff44] text-[#dbe7ff]" : "bg-transparent border-[#1a2a42] text-[#4a5f7f] hover:text-[#7f95bb]"}`}>
										⌨ Texto
									</button>
									<button aria-label="Modo señas — texto sin audio, iconos grandes" aria-pressed={inputMode === "signs"} onClick={() => { stopContinuousListening(); setInputMode("signs"); updateA11y({ textSize: "large", contrast: "high" }); }} className={`${isMobile ? "text-xs px-3 py-2" : "text-[10px] px-2.5 py-1.5"} rounded-lg border cursor-pointer transition-all ${inputMode === "signs" ? "bg-[#49c2ff15] border-[#49c2ff44] text-[#dbe7ff]" : "bg-transparent border-[#1a2a42] text-[#4a5f7f] hover:text-[#7f95bb]"}`}>
										🤟 Señas
									</button>
									<button aria-label="Configurar accesibilidad" onClick={() => setShowAdaptarme(v => !v)} className={`${isMobile ? "text-xs px-3 py-2" : "text-[10px] px-2 py-1.5"} rounded-lg border cursor-pointer transition-all ${showAdaptarme ? "bg-[#49c2ff15] border-[#49c2ff44] text-[#dbe7ff]" : "bg-transparent border-[#1a2a42] text-[#4a5f7f] hover:text-[#7f95bb]"}`}>
										♿ Adaptarme
									</button>
								</div>
								{/* Adaptarme panel */}
								{showAdaptarme && (
									<div className="mt-2 p-2 rounded-lg border border-[#1a2a42] bg-[#0a1628] text-[10px]" role="region" aria-label="Preferencias de accesibilidad">
										<div className="flex items-center justify-between mb-2">
											<span className="text-[#49c2ff] font-semibold">Preferencias</span>
											<button onClick={() => setShowAdaptarme(false)} className="text-[#4a5f7f] bg-transparent border-none cursor-pointer">&#x2715;</button>
										</div>
										<div className="grid gap-1.5">
											<div className="flex items-center justify-between">
												<span className="text-[#8ca0c6]">Texto</span>
												<div className="flex gap-1">
													{(["normal", "large", "xlarge"] as const).map(s => (
														<button key={s} onClick={() => updateA11y({ textSize: s })} className={`px-1.5 py-0.5 rounded ${a11yPrefs.textSize === s ? "bg-[#49c2ff22] text-[#49c2ff]" : "text-[#4a5f7f]"} cursor-pointer bg-transparent border-none`}>
															{s === "normal" ? "A" : s === "large" ? "A+" : "A++"}
														</button>
													))}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-[#8ca0c6]">Contraste</span>
												<div className="flex gap-1">
													{(["normal", "high"] as const).map(c => (
														<button key={c} onClick={() => updateA11y({ contrast: c })} className={`px-1.5 py-0.5 rounded ${a11yPrefs.contrast === c ? "bg-[#49c2ff22] text-[#49c2ff]" : "text-[#4a5f7f]"} cursor-pointer bg-transparent border-none`}>
															{c === "normal" ? "Normal" : "Alto"}
														</button>
													))}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-[#8ca0c6]">Vista simplificada</span>
												<button onClick={() => updateA11y({ simplified: !a11yPrefs.simplified })} className={`px-1.5 py-0.5 rounded ${a11yPrefs.simplified ? "bg-[#49c2ff22] text-[#49c2ff]" : "text-[#4a5f7f]"} cursor-pointer bg-transparent border-none`}>
													{a11yPrefs.simplified ? "Si" : "No"}
												</button>
											</div>
										</div>
									</div>
								)}
								<button onClick={() => setShowSidebar((v) => !v)} className="mt-2 text-[10px] text-[#49c2ff] hover:text-[#9be2ff] transition-colors cursor-pointer bg-transparent border-none">
									{showSidebar ? "Ocultar" : "Ver organismo"}
								</button>
							</>
						)}
						{!isMobile && <p className="text-[9px] text-[#4a5f7f] mt-2">{WS_URLS[wsUrlIdx]?.replace("wss://", "").replace("ws://", "")}</p>}
					</section>

					{/* ── Events + Input + Flow player ── */}
					<section className={`flex flex-col ${isMobile ? "max-h-[60vh]" : "max-h-[80vh]"}`}>
						{!isMobile && <h2 className="text-xs tracking-[0.18em] text-[#7f95bb] mb-3">EVENTOS</h2>}

						{/* Voice / Text Input */}
						{phase === "live" && (
							<div className="mb-3">
								{inputMode === "voice" ? (
									<div className="flex items-center justify-center gap-3 rounded-xl border border-[#35537c] bg-[rgba(7,18,33,0.7)] px-4 py-3">
										<div className="flex gap-1 items-center">
											{[0, 1, 2].map(i => (
												<div key={i} className="w-1.5 h-1.5 rounded-full" style={{
													background: isListening ? "#ec4899" : "#4a5f7f",
													animation: isListening ? `pulse 1.2s ease-in-out ${i * 0.2}s infinite` : "none",
												}} />
											))}
										</div>
										<span className="text-sm italic" style={{ color: interimText ? "#dbe7ff" : isListening ? "#ec4899" : "#4a5f7f" }}>
											{interimText || (isListening ? "Te escucho..." : "Activando...")}
										</span>
										<button onClick={() => { stopContinuousListening(); setInputMode("text"); }}
											className="text-[10px] text-[#4a5f7f] bg-transparent border-none cursor-pointer hover:text-[#7f95bb]">
											&#x2328; texto
										</button>
									</div>
								) : (
									<div className="flex gap-2">
										<input ref={inputRef} type="text" autoComplete="off" aria-label="Mensaje para ODI" placeholder="Escribe a ODI..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} disabled={isSending}
											className="flex-1 rounded-xl border border-[#35537c] bg-[rgba(7,18,33,0.7)] text-[#ddebff] px-4 py-3 text-sm outline-none focus:border-[#49c2ff] transition-colors disabled:opacity-50" />
										<button onClick={() => handleSend()} disabled={isSending || !chatInput.trim()}
											className="px-4 py-3 rounded-xl border border-[#35537c] bg-[#49c2ff11] text-[#49c2ff] text-sm cursor-pointer hover:bg-[#49c2ff22] transition-colors disabled:opacity-30 disabled:cursor-default">
											{isSending ? "..." : "Enviar"}

										</button>
									</div>
								)}
							</div>
						)}

						{/* Return Card */}
						{showReturnCard && returnContext && (
							<div className="mb-3 rounded-xl border border-[#c4a0ff22] p-3.5" style={{ background: "linear-gradient(135deg, #c4a0ff08, #060d18)" }}>
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<span className="text-sm">&#x1F9E0;</span>
										<span className="text-xs font-semibold text-[#c4a0ff]">Bienvenido de vuelta</span>
										<span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c4a0ff15] text-[#c4a0ff]">
											Visita #{returnContext.visit_count}
										</span>
									</div>
									<button onClick={() => { returnContext?.incomplete_flows?.forEach((f: any) => dismissFlow(f.flow_id)); setShowReturnCard(false); }} className="text-xs text-[#4a5f7f] bg-transparent border-none cursor-pointer hover:text-[#7f95bb]">
										&#x2715;
									</button>
								</div>
								{returnContext.resume_text && (
									<p className="text-sm text-[#d8e8ff] mb-3 pl-2 border-l-2 border-[#c4a0ff33] leading-relaxed">
										{returnContext.resume_text}
									</p>
								)}
								{returnContext.incomplete_flows?.length > 0 && (
									<div className="mb-3">
										<p className="text-[10px] text-[#4a5f7f] font-semibold mb-1.5">FLUJOS PENDIENTES</p>
										{returnContext.incomplete_flows.map((f: any, i: number) => (
											<button key={i} onClick={() => { setShowReturnCard(false); startFlowFromStep(f.flow_id, f.last_step || 0); }}
												className="flex items-center justify-between w-full px-2.5 py-1.5 mt-1 rounded-lg bg-[#0b1625] border border-[#162842] cursor-pointer hover:bg-[#0f1d30] transition-colors">
												<span className="text-xs text-[#d8e8ff]">{f.flow_id?.replace(/_/g, " ")}</span>
												<span className="text-[10px] text-[#c4a0ff]">paso {f.last_step} &#x2192;</span>
											</button>
										))}
									</div>
								)}
								<div className="flex gap-2">
									{returnContext.incomplete_flows?.length > 0 && (
										<button onClick={() => { setShowReturnCard(false); const f = returnContext.incomplete_flows[0]; startFlowFromStep(f.flow_id, f.last_step || 0); }}
											className="px-3 py-1.5 rounded-lg bg-[#c4a0ff15] border border-[#c4a0ff33] text-[#c4a0ff] text-xs font-semibold cursor-pointer hover:bg-[#c4a0ff22] transition-colors">
											&#x25B6; Continuar
										</button>
									)}
									<button onClick={() => { returnContext?.incomplete_flows?.forEach((f: any) => dismissFlow(f.flow_id)); setShowReturnCard(false); }}
										className="px-3 py-1.5 rounded-lg bg-transparent border border-[#162842] text-[#4a5f7f] text-xs cursor-pointer hover:text-[#7f95bb] transition-colors">
										Empezar de nuevo
									</button>
								</div>
							</div>
						)}

						{/* Active flow player */}
						{activeFlowId && activeFlowSeq.length > 0 && (
							<div className="mb-3 rounded-lg border border-[#2a1a42] bg-[#0d0a1e] p-3">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-semibold text-[#a78bfa]">
										{activeFlowMeta?.icon} {activeFlowMeta?.label} — paso {activeFlowStep + 1}/{activeFlowSeq.length}
									</span>
									<div className="flex gap-2">
										<button onClick={advanceFlow} className="text-[10px] px-2 py-0.5 rounded border border-[#a78bfa44] text-[#a78bfa] bg-transparent cursor-pointer hover:bg-[#a78bfa11]">
											{activeFlowStep >= activeFlowSeq.length - 1 ? "Cerrar" : "Siguiente \u2192"}
										</button>
										<button onClick={closeFlow} className="text-[10px] px-2 py-0.5 rounded border border-[#ff444444] text-[#ff4444] bg-transparent cursor-pointer hover:bg-[#ff444411]">\u2715</button>
									</div>
								</div>
								<div className="grid gap-1.5 max-h-[200px] overflow-y-auto">
									{activeFlowSeq.slice(0, activeFlowStep + 1).map((step: any, i: number) => (
										<div key={i} className="rounded px-2.5 py-1.5 text-xs" style={{
											background: step.role === "user" ? "#49c2ff08" : "#0a1628",
											borderLeft: `2px solid ${step.voice === "tony" ? "#ffcc00" : step.voice === "ramona" ? "#ec4899" : "#4a5f7f"}`,
										}}>
											<div className="flex gap-2 items-center mb-0.5">
												{step.voice && <span className="w-1.5 h-1.5 rounded-full" style={{ background: step.voice === "ramona" ? "#ec4899" : "#ffcc00" }} />}
												<span className="text-[10px] text-[#4a5f7f]">{step.role || step.phase || "?"}</span>
												{step.mode && <span className="text-[10px] text-[#7f95bb]">{step.mode}</span>}
											</div>
											<p className="text-[#dbe7ff]">{step.text}</p>
											{step.detail && <p className="text-[10px] text-[#4a5f7f] italic mt-0.5">{step.detail}</p>}
											{step.products?.map((p: any, j: number) => (
												<p key={j} className="text-[10px] text-[#8ca0c6] mt-0.5">
													{p.title}{p.price ? ` — $${p.price.toLocaleString()}` : ""}{p.from ? ` (${p.from})` : ""}
												</p>
											))}
											{step.system_action?.status && <p className="text-[10px] text-[#ffcc00] mt-0.5">{step.system_action.status}</p>}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Events stream */}
						<div className="overflow-y-auto flex-1 pr-2" role="log" aria-label="Conversacion con ODI" aria-live="polite">
							{events.length === 0 && phase !== "live" && <p className="text-sm text-[#4a5f7f]">Buscando al organismo...</p>}
							{events.length === 0 && phase === "live" && <p className="text-sm text-[#4a5f7f]">Estoy aqui. Escuchando...</p>}
							<div className="grid gap-2">
								{events.map((ev) => (
									<article key={ev.event_id} className="rounded-lg border border-[#1a2a42] bg-[#0a1628] px-4 py-3" style={{ animation: "fadeIn 0.3s ease-out" }}>
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color: SOURCE_COLORS[ev.source] || "#7f95bb", backgroundColor: `${SOURCE_COLORS[ev.source] || "#7f95bb"}18` }}>{ev.source}</span>
											<span className="text-xs text-[#4a5f7f]">{ev.type}</span>
											{ev.voice && <span className="text-xs text-[#4a5f7f]">({ev.voice})</span>}
											{ev.mode && <span className="text-xs text-[#4a5f7f]">{ev.mode}</span>}
											<span className="text-xs text-[#3a4f6f] ml-auto">{timeAgo(ev.ts)}</span>
										</div>
										{ev.system_action?.status && <p className="text-sm text-[#b6e5ff] mb-1">{ev.system_action.status}</p>}
										{ev.payload?.text && <p className={`${a11yPrefs.textSize === "xlarge" ? "text-lg" : a11yPrefs.textSize === "large" ? "text-base" : "text-sm"} ${a11yPrefs.contrast === "high" ? "text-[#dbe7ff]" : "text-[#8ca0c6]"}`}>{ev.payload.text}</p>}
									</article>
								))}
							</div>
						</div>
					</section>

					{/* ── Sidebar: Flows / Manifest / Stats ── */}
					{showSidebar && !isMobile && (
						<aside className="rounded-lg border border-[#1a2a42] bg-[#0a1628] p-3 overflow-y-scroll" style={{ height: "calc(100vh - 120px)", WebkitOverflowScrolling: "touch" }} role="complementary" aria-label="Panel del ecosistema ODI">
							{/* Tabs */}
							<div className="flex gap-1 mb-3">
								{(["manifest", "events", "domains", "flows", "stats"] as SideTab[]).map((t) => (
									<button key={t} onClick={() => setSideTab(t)}
										className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer transition-colors ${sideTab === t ? "bg-[#49c2ff22] border-[#49c2ff44] text-[#49c2ff]" : "bg-transparent border-[#1a2a42] text-[#4a5f7f] hover:text-[#7f95bb]"}`}>
										{t === "manifest" ? "Manifest" : t === "events" ? "Eventos" : t === "domains" ? "Dominios" : t === "flows" ? `Flujos (${flows.length})` : "Stats"}
									</button>
								))}
							</div>

							{/* ── Flows tab ── */}
							{sideTab === "flows" && (
								<div className="grid gap-3">
									{categories.length === 0 && (
										<div className="py-4">
											{[1,2,3].map(i => (<div key={i} className="rounded-lg bg-[#0a162855] h-8 mb-1 animate-pulse" />))}
											<p className="text-[10px] text-[#4a5f7f] text-center mt-2">Preparando los flujos...</p>
										</div>
									)}
									{categories.map((cat: any) => {
										const catFlows = flowsByCategory[cat.id] || [];
										if (catFlows.length === 0) return null;
										return (
											<div key={cat.id}>
												<h4 className="text-[10px] font-semibold mb-1.5" style={{ color: cat.color || "#7f95bb" }}>
													{cat.icon} {cat.label} ({catFlows.length})
												</h4>
												<div className="grid gap-1">
													{catFlows.map((f: any) => (
														<button key={f.id} onClick={() => startFlow(f.id)}
															className="text-left rounded px-2 py-1.5 border border-[#1a2a42] bg-[#03070d] hover:bg-[#0a1628] transition-colors cursor-pointer">
															<div className="flex items-center gap-1.5">
																<span className="text-xs">{f.icon}</span>
																<span className="text-[11px] text-[#dbe7ff]">{f.label}</span>
																<span className={`text-[9px] ml-auto px-1 rounded ${f.readiness === "live" ? "text-[#3af08f] bg-[#3af08f11]" : f.readiness === "partial" ? "text-[#ffcc00] bg-[#ffcc0011]" : "text-[#4a5f7f] bg-[#4a5f7f11]"}`}>
																	{f.readiness}
																</span>
															</div>
															<p className="text-[9px] text-[#4a5f7f] mt-0.5 line-clamp-1">{f.desc}</p>
															<p className="text-[9px] text-[#3a4f6f]">{f.steps} pasos · {f.services?.join(", ")}</p>
														</button>
													))}
												</div>
											</div>
										);
									})}
								</div>
							)}

							{/* ── Manifest tab ── */}
							{sideTab === "manifest" && !liveManifest && (
								<div className="grid gap-2 py-4">
									{[1,2,3,4].map(i => (
										<div key={i} className="rounded-lg bg-[#0a162855] h-10 animate-pulse" />
									))}
									<p className="text-[10px] text-[#4a5f7f] text-center">{panelLoading ? "Despertando..." : "Volviendo..."}</p>
								</div>
							)}
							{sideTab === "manifest" && liveManifest && (
								<div className="grid gap-3">
									<div>
										<h4 className="text-[10px] text-[#49c2ff] font-semibold mb-1.5">
											Servicios ({liveManifest.services_alive}/{liveManifest.services_total} alive)
										</h4>
										<div className="grid gap-1">
											{Object.entries(liveManifest.services || {}).map(([k, v]: [string, any]) => (
												<div key={k} className="flex items-center justify-between text-xs">
													<span className="text-[#8ca0c6]">{k}</span>
													<span style={{ color: SVC_COLOR[v.status] || "#4a5f7f" }}>{v.status}</span>
												</div>
											))}
										</div>
									</div>
									<div>
										<h4 className="text-[10px] text-[#49c2ff] font-semibold mb-1.5">Capabilities</h4>
										<div className="grid gap-0.5">
											{Object.entries(liveManifest.capabilities || {}).map(([k, v]: [string, any]) => (
												<div key={k} className="flex items-center gap-1.5 text-xs">
													<span className={v ? "text-[#3af08f]" : "text-[#4a5f7f]"}>{v ? "\u25CF" : "\u25CB"}</span>
													<span className="text-[#8ca0c6]">{k}</span>
												</div>
											))}
										</div>
									</div>
									{/* === Stores === */}
									<div>
										<h4 className="text-[10px] text-[#ff9800] font-semibold mb-1.5 tracking-wider">
											TIENDAS ({stores.filter(s => (s.active || 0) > 0).length}/{stores.length})
										</h4>
										<div className="grid gap-0.5">
											{stores.filter(s => (s.active || 0) > 0).map((s, i) => {
												const grade = s.grade || "?";
												const gradeColor = grade.startsWith("A") ? "#3af08f" : grade === "OK" ? "#ffcc00" : "#4a5f7f";
												return (
													<div key={i} className="flex items-center justify-between text-xs">
														<div className="flex items-center gap-1.5">
															<span className="w-1.5 h-1.5 rounded-full bg-[#3af08f]" />
															<span className="text-[#8ca0c6]">{s.store_id || "?"}</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-[#4a5f7f] text-[10px]">{(s.active || 0).toLocaleString()}</span>
															<span className="text-[10px] px-1 rounded font-semibold" style={{ color: gradeColor, backgroundColor: gradeColor + "18" }}>{grade}</span>
														</div>
													</div>
												);
											})}
										</div>
										<div className="flex items-center justify-between text-[10px] pt-1.5 mt-1.5 border-t border-[#1a2a42]">
											<span className="text-[#4a5f7f] font-semibold">TOTAL PRODUCTOS</span>
											<span className="text-[#ff9800] font-semibold">{stores.reduce((sum, s) => sum + (s.active || 0), 0).toLocaleString()}</span>
										</div>
									</div>

									{/* === Ecosystem === */}
									{liveManifest?.ecosystem && (
										<div>
											<h4 className="text-[10px] text-[#29b6f6] font-semibold mb-1.5 tracking-wider">ECOSISTEMA</h4>
											<div className="grid grid-cols-2 gap-1">
												{[
													{ label: "Pipeline", value: liveManifest.ecosystem.pipeline_version || "?", color: "#ffcc00" },
													{ label: "PG Tables", value: liveManifest.ecosystem.pg_tables || 0, color: "#29b6f6" },
													{ label: "PG Rows", value: (liveManifest.ecosystem.pg_rows || 0).toLocaleString(), color: "#29b6f6" },
													{ label: "ChromaDB", value: `${(liveManifest.ecosystem.chromadb_docs || 0).toLocaleString()} docs`, color: "#a78bfa" },
													{ label: "Jobs", value: liveManifest.ecosystem.pipeline_jobs || 0, color: "#ffcc00" },
													{ label: "Industrias", value: liveManifest.ecosystem.industries || 0, color: "#3af08f" },
													{ label: "CES", value: liveManifest.ces?.decisions_total ? `${liveManifest.ces.allowed}/${liveManifest.ces.blocked}/${liveManifest.ces.overrides}` : `${liveManifest.ecosystem?.ces_principles || 15} princ`, color: "#ef5350" },
													{ label: "Radar", value: `${liveManifest.ecosystem.radar_disciplines || 0} disc`, color: "#29b6f6" },
													{ label: "Git", value: `${liveManifest.ecosystem.git_commits || 0} commits`, color: "#4a5f7f" },
													{ label: "Events", value: (liveManifest.ecosystem.agent_events || 0).toLocaleString(), color: "#49c2ff" },
												].map((item, i) => (
													<div key={i} className="rounded bg-[#03070d88] px-1.5 py-1">
														<div className="text-[9px] text-[#4a5f7f]">{item.label}</div>
														<div className="text-[11px] font-semibold" style={{ color: item.color }}>{item.value}</div>
													</div>
												))}
											</div>
											{liveManifest.ecosystem.chromadb_collections?.length > 0 && (
												<div className="mt-1.5">
													<div className="text-[9px] text-[#4a5f7f] mb-0.5">Collections</div>
													{liveManifest.ecosystem.chromadb_collections.map((c: any, i: number) => (
														<div key={i} className="flex items-center justify-between text-[10px] text-[#4a5f7f]">
															<span>{c.name}</span>
															<span>{(c.docs || 0).toLocaleString()}</span>
														</div>
													))}
												</div>
											)}
										</div>
									)}

									{/* === WhatsApp === */}
									{liveManifest?.whatsapp && (
										<div className="rounded-lg p-2 border border-[#25D36622]" style={{ background: "#25D36608" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#25D366]">WhatsApp</span>
												<span className="text-[9px] px-1 rounded bg-[#25D36615] text-[#25D366]">{liveManifest.whatsapp.status}</span>
											</div>
											<div className="text-[10px] text-[#4a5f7f] mt-0.5">
												{liveManifest.whatsapp.number} · {liveManifest.whatsapp.multi_industry ? "Multi-industria" : "Mono"}
											</div>
										</div>
									)}

									{/* === CES === */}
									{liveManifest?.ces && (
										<div className="rounded-lg p-2 border border-[#ef535022]" style={{ background: "#ef535008" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#ef5350]">CES</span>
													<span className="text-[9px] px-1 rounded bg-[#ef535015] text-[#ef5350]">{liveManifest.ces.status}</span>
												</div>
												<span className="text-[10px] text-[#4a5f7f]">{liveManifest.ces.principles} principios</span>
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#3af08f]">{liveManifest.ces.allowed}</div>
													<div className="text-[8px] text-[#4a5f7f]">allowed</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ef5350]">{liveManifest.ces.blocked}</div>
													<div className="text-[8px] text-[#4a5f7f]">blocked</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff9800]">{liveManifest.ces.overrides}</div>
													<div className="text-[8px] text-[#4a5f7f]">override</div>
												</div>
											</div>
											<div className="text-[9px] text-[#4a5f7f] mt-1">{liveManifest.ces.decisions_total} decisiones totales</div>
										</div>
									)}

									{/* === BILLING === */}
									{liveManifest?.billing?.status === "operativo" ? (
										<div className="rounded-lg p-2 border border-[#4caf5022]" style={{ background: "#4caf5008" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#4caf50]">BILLING</span>
													<span className="text-[9px] px-1 rounded bg-[#4caf5015] text-[#4caf50]">
														{liveManifest.billing.medicion_solo ? "medición" : "activo"}
													</span>
												</div>
												<FreshnessTag data={liveManifest.billing} />
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#4caf50]">{liveManifest.billing.total_ventas}</div>
													<div className="text-[8px] text-[#4a5f7f]">ventas</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#4caf50]">${((liveManifest.billing.total_monto || 0) / 1000).toFixed(0)}K</div>
													<div className="text-[8px] text-[#4a5f7f]">revenue</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff9800]">${((liveManifest.billing.total_comision || 0) / 1000).toFixed(1)}K</div>
													<div className="text-[8px] text-[#4a5f7f]">comisión</div>
												</div>
											</div>
										</div>
									) : liveManifest?.billing?._fetched_at ? <DegradedCard name="BILLING" data={liveManifest.billing} /> : null}

									{/* === GUARDIAN === */}
									{liveManifest?.guardian?.status === "operativo" ? (
										<div className="rounded-lg p-2 border border-[#ff980022]" style={{ background: "#ff980008" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#ff9800]">GUARDIAN</span>
													<span className="text-[9px] px-1 rounded bg-[#ff980015] text-[#ff9800]">
														{liveManifest.guardian.services_summary?.alive || 0}/{liveManifest.guardian.services_summary?.total || 0} servicios
													</span>
												</div>
												<FreshnessTag data={liveManifest.guardian} />
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff9800]">{liveManifest.guardian.stores_total}</div>
													<div className="text-[8px] text-[#4a5f7f]">tiendas</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#3af08f]">{(liveManifest.guardian.products_active || 0).toLocaleString()}</div>
													<div className="text-[8px] text-[#4a5f7f]">activos</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#49c2ff]">{(liveManifest.guardian.products_total || 0).toLocaleString()}</div>
													<div className="text-[8px] text-[#4a5f7f]">total</div>
												</div>
											</div>
										</div>
									) : liveManifest?.guardian?._fetched_at ? <DegradedCard name="GUARDIAN" data={liveManifest.guardian} /> : null}

									{/* === PIPELINE === */}
									{liveManifest?.pipeline?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#ffcc0022]" style={{ background: "#ffcc0008" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#ffcc00]">PIPELINE</span>
													<span className="text-[9px] px-1 rounded bg-[#ffcc0015] text-[#ffcc00]">{liveManifest.pipeline.version}</span>
												</div>
												<span className="text-[10px] text-[#4a5f7f]">{liveManifest.pipeline.steps} steps</span>
											</div>
											<div className="text-[10px] text-[#8ca0c6] mt-1">
												{liveManifest.pipeline.total_ejecuciones} ejecuciones
											</div>
											{liveManifest.pipeline.last_execution && (
												<div className="text-[9px] text-[#4a5f7f] mt-0.5">
													Última: {liveManifest.pipeline.last_execution.store} → {liveManifest.pipeline.last_execution.status}
													{" "}({liveManifest.pipeline.last_execution.products_out} productos)
												</div>
											)}
											{liveManifest.pipeline.by_store && (
												<div className="flex flex-wrap gap-1 mt-1">
													{liveManifest.pipeline.by_store.map((s: any) => (
														<span key={s.store} className="text-[8px] px-1 py-0.5 rounded bg-[#1a2a42] text-[#8ca0c6]">
															{s.store}: {s.runs}
														</span>
													))}
												</div>
											)}
										</div>
									)}

									{/* === LEADS === */}
									{liveManifest?.leads?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#26a69a22]" style={{ background: "#26a69a08" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#26a69a]">LEADS</span>
													<span className="text-[9px] px-1 rounded bg-[#26a69a15] text-[#26a69a]">{liveManifest.leads.total} capturados</span>
												</div>
											</div>
											{liveManifest.leads.by_industry && (
												<div className="flex gap-2 mt-1">
													{liveManifest.leads.by_industry.map((ind: any) => (
														<div key={ind.industry_id} className="text-center">
															<div className="text-[11px] font-semibold text-[#26a69a]">{ind.total}</div>
															<div className="text-[8px] text-[#4a5f7f]">{ind.industry_id}</div>
														</div>
													))}
												</div>
											)}
										</div>
									)}

									{/* === TURISMO === */}
									{liveManifest?.tourism?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#ff704322]" style={{ background: "#ff704308" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#ff7043]">TURISMO</span>
													<span className="text-[9px] px-1 rounded bg-[#ff704315] text-[#ff7043]">{liveManifest.tourism.pisos_construidos} pisos</span>
												</div>
												<span className="text-[10px] text-[#4a5f7f]">{liveManifest.tourism.crons_activos} crons</span>
											</div>
											<div className="grid grid-cols-4 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff7043]">{liveManifest.tourism.bookings}</div>
													<div className="text-[8px] text-[#4a5f7f]">bookings</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#26a69a]">{liveManifest.tourism.leads}</div>
													<div className="text-[8px] text-[#4a5f7f]">leads</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#49c2ff]">{liveManifest.tourism.quotes}</div>
													<div className="text-[8px] text-[#4a5f7f]">quotes</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#8ca0c6]">{liveManifest.tourism.events}</div>
													<div className="text-[8px] text-[#4a5f7f]">events</div>
												</div>
											</div>
										</div>
									)}

									{/* === TIENDAS DEPTH === */}
									{liveManifest?.stores_depth?.stores?.length > 0 && (
										<div className="rounded-lg p-2 border border-[#9c27b022]" style={{ background: "#9c27b008" }}>
											<div className="flex items-center gap-1.5 mb-1">
												<span className="text-xs font-semibold text-[#9c27b0]">TIENDAS</span>
												<span className="text-[9px] px-1 rounded bg-[#9c27b015] text-[#9c27b0]">
													{liveManifest.stores_depth.total} snapshots
												</span>
											</div>
											<div className="space-y-0.5">
												{liveManifest.stores_depth.stores.map((s: any) => (
													<div key={s.store_id} className="flex items-center justify-between text-[9px]">
														<span className="text-[#8ca0c6] font-medium">{s.store_id?.toUpperCase()}</span>
														<div className="flex items-center gap-1.5">
															<span className={`px-1 rounded ${s.grade === 'A+' ? 'bg-[#3af08f15] text-[#3af08f]' : s.grade === 'A' ? 'bg-[#49c2ff15] text-[#49c2ff]' : 'bg-[#ffcc0015] text-[#ffcc00]'}`}>
																{s.grade || '—'}
															</span>
															<span className="text-[#4a5f7f]">{s.active} act</span>
															<span className="text-[#4a5f7f]">img:{s.image_coverage}%</span>
															{s.gaps > 0 && <span className="text-[#ff9800]">{s.gaps} gaps</span>}
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* === SELF-HEALING === */}
									{liveManifest?.self_healing?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#00bcd422]" style={{ background: "#00bcd408" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#00bcd4]">SELF-HEALING</span>
												</div>
												<span className="text-[10px] text-[#4a5f7f]">
													{liveManifest.self_healing.gaps_total || 0} gaps detectados
												</span>
											</div>
											{liveManifest.self_healing.stores?.length > 0 && (
												<div className="space-y-0.5 mt-1">
													{liveManifest.self_healing.stores.map((s: any) => (
														<div key={s.store_id} className="flex items-center justify-between text-[9px]">
															<span className="text-[#8ca0c6]">{s.store_id?.toUpperCase()}</span>
															<div className="flex items-center gap-1.5">
																<span className="text-[#4a5f7f]">{s.grade}</span>
																<span className="text-[#ff9800]">{s.gaps_count} gaps</span>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									)}

									{/* === RADAR LINK === */}
									<div className="rounded-lg p-2 border border-[#f9731622]" style={{ background: "#f9731608" }}>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#f97316]">RADAR</span>
												<span className="text-[9px] px-1 rounded bg-[#f9731615] text-[#f97316]">v3.2.0</span>
											</div>
											<a href="https://radar.liveodi.com" target="_blank" rel="noopener noreferrer"
												className="text-[9px] px-1.5 py-0.5 rounded bg-[#f9731620] text-[#f97316] hover:bg-[#f9731630] transition-colors">
												Abrir Panel
											</a>
										</div>
										<div className="text-[9px] text-[#4a5f7f] mt-0.5">
											15 disciplinas · 33 juegos · guardian verde
										</div>
									</div>

									{/* === LOG STATS === */}
									{liveManifest?.log_stats?.total_logs > 0 && (
										<div className="rounded-lg p-2 border border-[#78909c22]" style={{ background: "#78909c08" }}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-semibold text-[#78909c]">LOGS</span>
													<span className="text-[9px] px-1 rounded bg-[#78909c15] text-[#78909c]">
														{liveManifest.log_stats.active_logs}/{liveManifest.log_stats.total_logs} activos
													</span>
												</div>
												<span className="text-[10px] text-[#4a5f7f]">
													{liveManifest.log_stats.total_size_kb}KB
												</span>
											</div>
											<div className="text-[9px] text-[#4a5f7f] mt-0.5">
												{liveManifest.log_stats.total_lines} líneas registradas
											</div>
											<div className="flex flex-wrap gap-1 mt-1">
												{liveManifest.log_stats.logs && Object.entries(liveManifest.log_stats.logs).map(([name, info]: [string, any]) => (
													<span key={name} className={`text-[7px] px-1 py-0.5 rounded ${info.active ? 'bg-[#3af08f15] text-[#3af08f]' : 'bg-[#1a2a42] text-[#4a5f7f]'}`}>
														{name}
													</span>
												))}
											</div>
										</div>
									)}

									{/* === NARRATIVA VIVA DEL ORGANISMO === */}
									{liveManifest.narrative && (
										<div className="rounded-lg p-2.5 border border-[#49c2ff22] mt-1" style={{ background: "linear-gradient(135deg, #49c2ff06, #03070d)" }}>
											<div className="text-[10px] text-[#8ca0c6] font-medium mb-1.5">
												{liveManifest.narrative.summary}
											</div>
											<div className="space-y-1">
												{[
													{ key: "billing", icon: "●", color: "#4caf50" },
													{ key: "guardian", icon: "●", color: liveManifest.narrative.guardian_health === "verde" ? "#3af08f" : liveManifest.narrative.guardian_health === "amarillo" ? "#ffcc00" : "#ff9800" },
													{ key: "pipeline", icon: "●", color: "#ffcc00" },
													{ key: "ces", icon: "●", color: "#ef5350" },
													{ key: "leads", icon: "●", color: "#26a69a" },
													{ key: "tourism", icon: "●", color: "#ff7043" },
													{ key: "logs", icon: "●", color: "#78909c" },
												].map(({ key, icon, color }) => {
													const text = liveManifest.narrative[key];
													const voice = liveManifest.narrative[`${key}_voice`];
													if (!text) return null;
													return (
														<div key={key} className="text-[9px]">
															<span style={{ color }}>{icon}</span>
															<span className="text-[#8ca0c6] ml-1">{text}</span>
															{voice && <span className="text-[#4a5f7f] ml-1 italic">— {voice}</span>}
														</div>
													);
												})}
											</div>
											{liveManifest.narrative.summary_voice && (
												<div className="text-[9px] text-[#49c2ff] mt-1.5 italic">
													"{liveManifest.narrative.summary_voice}"
												</div>
											)}
										</div>
									)}

									{/* === FRESHNESS === */}
									<div className="text-[10px] pt-1.5 mt-1 border-t border-[#1a2a42]">
										<div className="flex items-center justify-between">
											<span className="text-[8px] text-[#3a4f6f]">v{liveManifest.version}</span>
											{liveManifest.generated_at && (
												<span className="text-[8px] text-[#3af08f]">{timeAgo(liveManifest.generated_at)}</span>
											)}
										</div>
									</div>
								</div>
							)}

							{/* ── Stats tab ── */}
							{sideTab === "stats" && !stats && (
								<div className="grid gap-2 py-4">
									{[1,2,3,4].map(i => (
										<div key={i} className="rounded-lg bg-[#0a162855] h-10 animate-pulse" />
									))}
									<p className="text-[10px] text-[#4a5f7f] text-center">Contando latidos...</p>
								</div>
							)}
							{sideTab === "stats" && stats && (
								<div className="grid gap-3">
									<div className="grid grid-cols-2 gap-2">
										{[
											["Devices", stats.devices_total],
											["Sessions", stats.sessions_total],
											["Events", stats.events_total],
											["Flows done", stats.flows_completed],
										].map(([label, val]) => (
											<div key={label as string} className="rounded border border-[#1a2a42] bg-[#03070d] p-2 text-center">
												<p className="text-lg font-bold text-[#dbe7ff]">{(val as number)?.toLocaleString()}</p>
												<p className="text-[9px] text-[#4a5f7f]">{label as string}</p>
											</div>
										))}
									</div>
									<div>
										<h4 className="text-[10px] text-[#49c2ff] font-semibold mb-1.5">Events by source</h4>
										<div className="grid gap-1">
											{Object.entries(stats.events_by_source || {}).map(([src, count]: [string, any]) => (
												<div key={src} className="flex items-center justify-between text-xs">
													<span style={{ color: SOURCE_COLORS[src] || "#7f95bb" }}>{src}</span>
													<span className="text-[#8ca0c6]">{count}</span>
												</div>
											))}
										</div>
									</div>
									<p className="text-[9px] text-[#4a5f7f]">
										{stats.sessions_active} sesiones activas ahora
									</p>
								</div>
							)}

							{/* ── Events tab ── */}
							{sideTab === "events" && (
								<div className="grid gap-1.5">
									{recentEvents.length === 0 && (
										<p className="text-[10px] text-[#4a5f7f] py-4 text-center">Cargando eventos...</p>
									)}
									{recentEvents.map((ev: any, i: number) => (
										<div key={i} className="rounded border border-[#1a2a42] bg-[#03070d] px-2.5 py-1.5">
											<div className="flex items-center gap-1.5 mb-0.5">
												<span className="text-[10px] font-semibold px-1 rounded" style={{ color: SOURCE_COLORS[ev.source] || "#7f95bb", backgroundColor: `${SOURCE_COLORS[ev.source] || "#7f95bb"}15` }}>{ev.source}</span>
												<span className="text-[9px] text-[#4a5f7f]">{ev.type}</span>
												{ev.voice && <span className="text-[9px] text-[#4a5f7f]">({ev.voice})</span>}
												<span className="text-[8px] text-[#3a4f6f] ml-auto">{ev.ts ? new Date(ev.ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
											</div>
											{ev.status && <p className="text-[9px] text-[#8ca0c6]">{ev.status}</p>}
											{ev.text && <p className="text-[9px] text-[#4a5f7f]">{(ev.text || "").slice(0, 100)}</p>}
										</div>
									))}
								</div>
							)}

							{/* ── Domains tab ── */}
							{sideTab === "domains" && domains && (
								<div className="grid gap-2">
									<div className="flex items-center justify-between text-[10px] mb-1">
										<span className="text-[#49c2ff] font-semibold">Dominios del ecosistema</span>
										<span className="text-[#4a5f7f]">{domains.active}/{domains.total} activos</span>
									</div>
									{(domains.layers || []).map((layer: any, li: number) => (
										<div key={li}>
											<h4 className="text-[9px] font-semibold text-[#7f95bb] mb-1 tracking-wider">{layer.name}</h4>
											{(layer.domains || []).map((d: any, di: number) => (
												<div key={di} className="flex items-center justify-between text-[10px] py-0.5">
													<div className="flex items-center gap-1.5">
														<span className="w-1.5 h-1.5 rounded-full" style={{ background: d.status === "production" ? "#3af08f" : d.status === "dead" ? "#ff4444" : "#ffcc00" }} />
														<span className="text-[#8ca0c6]">{d.domain}</span>
													</div>
													<span className="text-[8px] text-[#4a5f7f]">{d.ssl ? "🔒" : "⚠"}</span>
												</div>
											))}
										</div>
									))}
									{domains.repos_pending > 0 && (
										<p className="text-[9px] text-[#ffcc00] mt-1">{domains.repos_pending} repos listos sin dominio Vercel</p>
									)}
									{domains.dead > 0 && (
										<p className="text-[9px] text-[#ff4444]">{domains.dead} dominios muertos (legacy)</p>
									)}
								</div>
							)}
							{sideTab === "domains" && !domains && (
								<div className="py-4">
									{[1,2,3].map(i => (<div key={i} className="rounded-lg bg-[#0a162855] h-8 mb-1 animate-pulse" />))}
								</div>
							)}
						</aside>
					)}
				</div>

				{/* Mobile sidebar — inline below grid */}
				{showSidebar && isMobile && (
					<div className="fixed inset-0 z-50 bg-[#03070dee] overflow-y-scroll" style={{ WebkitOverflowScrolling: "touch" }}>
						<div className="max-w-md mx-auto p-4">
							<div className="flex gap-1 mb-3 items-center">
								{(["manifest", "flows", "stats"] as SideTab[]).map((t) => (
									<button key={t} onClick={() => setSideTab(t)}
										className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer transition-colors ${sideTab === t ? "bg-[#49c2ff22] border-[#49c2ff44] text-[#49c2ff]" : "bg-transparent border-[#1a2a42] text-[#4a5f7f]"}`}>
										{t === "flows" ? `Flujos` : t === "manifest" ? "Manifest" : "Stats"}
									</button>
								))}
								<button onClick={() => setShowSidebar(false)} className="ml-auto text-xs text-[#4a5f7f] bg-transparent border-none cursor-pointer px-2 py-1">&#x2715; Cerrar</button>
							</div>

							{sideTab === "manifest" && !liveManifest && (
								<div className="grid gap-2 py-4">
									{[1,2,3,4].map(i => (<div key={i} className="rounded-lg bg-[#0a162855] h-10 animate-pulse" />))}
									<p className="text-[10px] text-[#4a5f7f] text-center">{panelLoading ? "Despertando..." : "Volviendo..."}</p>
								</div>
							)}
							{sideTab === "manifest" && liveManifest && (
								<div className="grid gap-3">
									{/* Services */}
									<div>
										<h4 className="text-[10px] text-[#49c2ff] font-semibold mb-1.5">
											Servicios ({liveManifest.services_alive}/{liveManifest.services_total})
										</h4>
										<div className="grid grid-cols-2 gap-1">
											{Object.entries(liveManifest.services || {}).map(([name, svc]: [string, any]) => (
												<div key={name} className="flex items-center gap-1.5 text-[10px]">
													<span className="w-1.5 h-1.5 rounded-full" style={{ background: svc.status === "alive" ? "#3af08f" : svc.status === "degraded" ? "#ffcc00" : "#ff4444" }} />
													<span className="text-[#8ca0c6]">{name}</span>
												</div>
											))}
										</div>
									</div>

									{/* Billing */}
									{liveManifest?.billing?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#4caf5022]" style={{ background: "#4caf5008" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#4caf50]">BILLING</span>
												<span className="text-[9px] px-1 rounded bg-[#4caf5015] text-[#4caf50]">{liveManifest.billing.medicion_solo ? "medición" : "activo"}</span>
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#4caf50]">{liveManifest.billing.total_ventas}</div>
													<div className="text-[8px] text-[#4a5f7f]">ventas</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#4caf50]">${((liveManifest.billing.total_monto || 0) / 1000).toFixed(0)}K</div>
													<div className="text-[8px] text-[#4a5f7f]">revenue</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff9800]">${((liveManifest.billing.total_comision || 0) / 1000).toFixed(1)}K</div>
													<div className="text-[8px] text-[#4a5f7f]">comisión</div>
												</div>
											</div>
										</div>
									)}

									{/* Guardian */}
									{liveManifest?.guardian?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#ff980022]" style={{ background: "#ff980008" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#ff9800]">GUARDIAN</span>
												<span className="text-[9px] px-1 rounded bg-[#ff980015] text-[#ff9800]">{liveManifest.guardian.services_summary?.alive || 0}/{liveManifest.guardian.services_summary?.total || 0} srv</span>
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff9800]">{liveManifest.guardian.stores_total}</div>
													<div className="text-[8px] text-[#4a5f7f]">tiendas</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#3af08f]">{(liveManifest.guardian.products_active || 0).toLocaleString()}</div>
													<div className="text-[8px] text-[#4a5f7f]">activos</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#49c2ff]">{(liveManifest.guardian.products_total || 0).toLocaleString()}</div>
													<div className="text-[8px] text-[#4a5f7f]">total</div>
												</div>
											</div>
										</div>
									)}

									{/* CES */}
									{liveManifest?.ces && (
										<div className="rounded-lg p-2 border border-[#ef535022]" style={{ background: "#ef535008" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#ef5350]">CES</span>
												<span className="text-[9px] px-1 rounded bg-[#ef535015] text-[#ef5350]">{liveManifest.ces.status}</span>
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#3af08f]">{liveManifest.ces.allowed}</div>
													<div className="text-[8px] text-[#4a5f7f]">allowed</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ef5350]">{liveManifest.ces.blocked}</div>
													<div className="text-[8px] text-[#4a5f7f]">blocked</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff9800]">{liveManifest.ces.overrides}</div>
													<div className="text-[8px] text-[#4a5f7f]">override</div>
												</div>
											</div>
										</div>
									)}

									{/* Pipeline */}
									{liveManifest?.pipeline?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#ffcc0022]" style={{ background: "#ffcc0008" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#ffcc00]">PIPELINE</span>
												<span className="text-[9px] px-1 rounded bg-[#ffcc0015] text-[#ffcc00]">{liveManifest.pipeline.version}</span>
											</div>
											<div className="text-[10px] text-[#8ca0c6] mt-1">{liveManifest.pipeline.total_ejecuciones} ejecuciones</div>
											{liveManifest.pipeline.last_execution && (
												<div className="text-[9px] text-[#4a5f7f] mt-0.5">
													Última: {liveManifest.pipeline.last_execution.store} → {liveManifest.pipeline.last_execution.status}
												</div>
											)}
										</div>
									)}

									{/* Leads */}
									{liveManifest?.leads?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#26a69a22]" style={{ background: "#26a69a08" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#26a69a]">LEADS</span>
												<span className="text-[9px] px-1 rounded bg-[#26a69a15] text-[#26a69a]">{liveManifest.leads.total} capturados</span>
											</div>
										</div>
									)}

									{/* Tourism */}
									{liveManifest?.tourism?.status === "operativo" && (
										<div className="rounded-lg p-2 border border-[#ff704322]" style={{ background: "#ff704308" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#ff7043]">TURISMO</span>
												<span className="text-[9px] px-1 rounded bg-[#ff704315] text-[#ff7043]">{liveManifest.tourism.pisos_construidos} pisos</span>
											</div>
											<div className="grid grid-cols-3 gap-1 mt-1.5">
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#ff7043]">{liveManifest.tourism.bookings}</div>
													<div className="text-[8px] text-[#4a5f7f]">bookings</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#26a69a]">{liveManifest.tourism.leads}</div>
													<div className="text-[8px] text-[#4a5f7f]">leads</div>
												</div>
												<div className="text-center">
													<div className="text-[11px] font-semibold text-[#8ca0c6]">{liveManifest.tourism.events}</div>
													<div className="text-[8px] text-[#4a5f7f]">events</div>
												</div>
											</div>
										</div>
									)}

									{/* Radar */}
									<div className="rounded-lg p-2 border border-[#f9731622]" style={{ background: "#f9731608" }}>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#f97316]">RADAR</span>
												<span className="text-[9px] px-1 rounded bg-[#f9731615] text-[#f97316]">v3.2.0</span>
											</div>
											<a href="https://radar.liveodi.com" target="_blank" rel="noopener noreferrer"
												className="text-[9px] px-1.5 py-0.5 rounded bg-[#f9731620] text-[#f97316]">
												Abrir
											</a>
										</div>
									</div>

									{/* Log Stats */}
									{liveManifest?.log_stats?.total_logs > 0 && (
										<div className="rounded-lg p-2 border border-[#78909c22]" style={{ background: "#78909c08" }}>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-semibold text-[#78909c]">LOGS</span>
												<span className="text-[9px] px-1 rounded bg-[#78909c15] text-[#78909c]">{liveManifest.log_stats.active_logs}/{liveManifest.log_stats.total_logs} activos</span>
												<span className="text-[9px] text-[#4a5f7f]">{liveManifest.log_stats.total_lines} líneas</span>
											</div>
										</div>
									)}

									{/* Version + freshness footer */}
									{/* Narrativa viva (mobile) */}
									{liveManifest.narrative && (
										<div className="rounded-lg p-2.5 border border-[#49c2ff22] mt-1" style={{ background: "linear-gradient(135deg, #49c2ff06, #03070d)" }}>
											<div className="text-[10px] text-[#8ca0c6] font-medium mb-1.5">{liveManifest.narrative.summary}</div>
											<div className="space-y-1">
												{[
													{ key: "billing", color: "#4caf50" },
													{ key: "guardian", color: liveManifest.narrative.guardian_health === "verde" ? "#3af08f" : liveManifest.narrative.guardian_health === "amarillo" ? "#ffcc00" : "#ff9800" },
													{ key: "pipeline", color: "#ffcc00" },
													{ key: "ces", color: "#ef5350" },
													{ key: "leads", color: "#26a69a" },
													{ key: "tourism", color: "#ff7043" },
													{ key: "logs", color: "#78909c" },
												].map(({ key, color }) => {
													const text = liveManifest.narrative[key];
													const voice = liveManifest.narrative[`${key}_voice`];
													if (!text) return null;
													return (
														<div key={key} className="text-[9px]">
															<span style={{ color }}>●</span>
															<span className="text-[#8ca0c6] ml-1">{text}</span>
															{voice && <span className="text-[#4a5f7f] ml-1 italic">— {voice}</span>}
														</div>
													);
												})}
											</div>
											{liveManifest.narrative.summary_voice && (
												<div className="text-[9px] text-[#49c2ff] mt-1.5 italic">"{liveManifest.narrative.summary_voice}"</div>
											)}
										</div>
									)}
									<div className="text-[10px] pt-2 border-t border-[#1a2a42]">
										<div className="flex items-center justify-between">
											<span className="text-[#4a5f7f]">v{liveManifest.version} · {liveManifest.flows_available} flows</span>
											{liveManifest.generated_at && (
												<span className="text-[8px] text-[#3af08f]">{timeAgo(liveManifest.generated_at)}</span>
											)}
										</div>
									</div>
								</div>
							)}

							{sideTab === "flows" && (
								<div className="grid gap-3">
									{categories.map((cat: any) => {
										const catFlows = (flows || []).filter((f: any) => f.category === cat.id);
										if (catFlows.length === 0) return null;
										return (
											<div key={cat.id}>
												<h4 className="text-[10px] font-semibold mb-1.5" style={{ color: cat.color || "#7f95bb" }}>
													{cat.icon} {cat.label} ({catFlows.length})
												</h4>
												<div className="grid gap-1">
													{catFlows.map((f: any) => (
														<button key={f.id} onClick={() => { startFlow(f.id); setShowSidebar(false); }}
															className="text-left rounded px-2 py-1.5 border border-[#1a2a42] bg-[#03070d] cursor-pointer w-full">
															<div className="flex items-center gap-1.5">
																<span className="text-xs">{f.icon}</span>
																<span className="text-[11px] text-[#dbe7ff]">{f.label}</span>
																<span className={`text-[9px] ml-auto px-1 rounded ${f.readiness === "live" ? "text-[#3af08f] bg-[#3af08f11]" : f.readiness === "partial" ? "text-[#ffcc00] bg-[#ffcc0011]" : "text-[#4a5f7f] bg-[#4a5f7f11]"}`}>
																	{f.readiness}
																</span>
															</div>
															<p className="text-[9px] text-[#4a5f7f] mt-0.5">{f.desc}</p>
														</button>
													))}
												</div>
											</div>
										);
									})}
									{flows.length === 0 && <p className="text-[10px] text-[#4a5f7f]">Preparando flujos...</p>}
								</div>
							)}

							{sideTab === "stats" && stats && (
								<div className="grid gap-3">
									<div className="grid grid-cols-2 gap-2">
										{[
											["Devices", stats.devices_total],
											["Sessions", stats.sessions_total],
											["Events", stats.events_total],
											["Flows done", stats.flows_completed],
										].map(([label, val]) => (
											<div key={label as string} className="rounded border border-[#1a2a42] bg-[#03070d] p-2 text-center">
												<p className="text-lg font-bold text-[#dbe7ff]">{(val as number)?.toLocaleString()}</p>
												<p className="text-[9px] text-[#4a5f7f]">{label as string}</p>
											</div>
										))}
									</div>
									<div>
										<h4 className="text-[10px] text-[#49c2ff] font-semibold mb-1.5">Events by source</h4>
										<div className="grid gap-1">
											{Object.entries(stats.events_by_source || {}).map(([src, count]: [string, any]) => (
												<div key={src} className="flex items-center justify-between text-xs">
													<span style={{ color: SOURCE_COLORS[src] || "#7f95bb" }}>{src}</span>
													<span className="text-[#8ca0c6]">{count}</span>
												</div>
											))}
										</div>
									</div>
									<p className="text-[9px] text-[#4a5f7f]">{stats.sessions_active} sesiones activas</p>
								</div>
							)}
							{sideTab === "stats" && !stats && (
								<p className="text-[10px] text-[#4a5f7f]">Cargando stats...</p>
							)}
						</div>
					</div>
				)}
			</div>
			{showDebug && (
				<div className="fixed bottom-0 left-0 right-0 bg-black/80 text-[10px] text-gray-400 px-2 py-1 flex gap-4 z-50 font-mono">
					<span>WS: {phase === "live" ? "connected" : phase}</span>
					<span>Mode: {inputMode}</span>
					<span>Audio: {userHasInteracted ? "unlocked" : "locked"}</span>
					<span>Greeted: {hasGreetedRef.current ? "yes" : "no"}</span>
					<span>Speaking: {isSpeaking ? "yes" : "no"}</span>
					<span>Listening: {isListening ? "yes" : "no"}</span>
				</div>
			)}
		</main>
	);
}
