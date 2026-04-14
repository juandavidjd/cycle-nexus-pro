"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/*
 * LIVEODI — Habitat Real de ODI
 * Esfera que respira. Ramona y Tony presentes. Conversación natural.
 * HER reference: "Hello, I'm here." → conversación → detección → acción
 *
 * NO es chat. NO es dashboard. Es presencia.
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

const VOICE_META: Record<string, { color: string; label: string; role: string }> = {
	ramona: { color: "#c4a0ff", label: "Ramona", role: "anfitriona" },
	tony: { color: "#49c2ff", label: "Tony", role: "maestro" },
};

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
					{data.mode && <span style={{ fontSize: "0.5rem", color: P.textDim, marginLeft: 8 }}>◆ {data.mode}</span>}
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
				<button onClick={onDismiss} style={{ background: "transparent", border: "none", color: P.textDim, cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
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
				<button onClick={onDismiss} style={{ background: "transparent", border: "none", color: P.textDim, cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
			</div>
			<p style={{ fontSize: "0.76rem", color: P.textSoft, margin: 0, lineHeight: 1.5 }}>{data.content || ""}</p>
			{data.source && <p style={{ fontSize: "0.56rem", color: P.textFaint, marginTop: 6 }}>Fuente: {data.source}</p>}
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
		</div>
	);
}

export default function LiveODI() {
	const [phase, setPhase] = useState<"landing" | "awakening" | "habitat">("landing");
	const [msgs, setMsgs] = useState<Msg[]>([]);
	const [input, setInput] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [orbColor, setOrbColor] = useState(P.glow);
	const [isSpeaking, setIsSpeaking] = useState(false);

	// Referral system
	const [referrer, setReferrer] = useState<string | null>(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const ref = params.get("ref");
		if (ref) { setReferrer(ref); localStorage.setItem("odi_referrer", ref); }
		else { const saved = localStorage.getItem("odi_referrer"); if (saved) setReferrer(saved); }
	}, []);
	const [ephemeral, setEphemeral] = useState<EphemeralData | null>(null);
	const [ephProducts, setEphProducts] = useState<any[]>([]);
	const [accessMode, setAccessMode] = useState<string>(() => {
		if (typeof window === "undefined") return "normal";
		return localStorage.getItem("odi_a11y_mode") || "normal";
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
	const hasConvo = msgs.length > 0 && phase === "habitat";

	// TTS — declared early so useEffects can reference it
	const speak = useCallback(async (text: string, voice: string = "ramona") => {
		if (isPlayingRef.current || !text) return;
		try {
			isPlayingRef.current = true;
			setIsSpeaking(true);
			const resp = await fetch(SPEAK_URL, {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: text.slice(0, 500), voice }),
			});
			if (resp.ok) {
				const blob = await resp.blob();
				const url = URL.createObjectURL(blob);
				const audio = audioRef.current || new Audio();
				audioRef.current = audio;
				audio.onended = () => { isPlayingRef.current = false; setIsSpeaking(false); URL.revokeObjectURL(url); };
				audio.onerror = () => { isPlayingRef.current = false; setIsSpeaking(false); };
				audio.src = url;
				await audio.play();
			} else { isPlayingRef.current = false; setIsSpeaking(false); }
		} catch { isPlayingRef.current = false; setIsSpeaking(false); }
	}, []);

	// STT — continuous speech recognition
	const recognitionRef = useRef<any>(null);
	const [isListening, setIsListening] = useState(false);
	const latestTextRef = useRef("");

	const startListening = useCallback(() => {
		const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SR) return;
		const rec = new SR();
		rec.lang = "es-CO";
		rec.continuous = true;
		rec.interimResults = true;
		rec.onresult = (event: any) => {
			if (isPlayingRef.current) return;
			const last = event.results[event.results.length - 1];
			if (!last) return;
			latestTextRef.current = last[0].transcript.trim();
		};
		rec.onend = () => {
			if (isPlayingRef.current) { setIsListening(false); return; }
			if (accessMode === "voice") {
				setTimeout(() => { try { rec.start(); } catch {} }, 500);
			} else { setIsListening(false); }
		};
		rec.onerror = () => {};
		try { rec.start(); recognitionRef.current = rec; setIsListening(true); } catch {}
	}, [accessMode]);

	const stopListening = useCallback(() => {
		try { recognitionRef.current?.stop(); } catch {}
		recognitionRef.current = null;
		setIsListening(false);
	}, []);

	// Auto-send after 2s silence when listening
	useEffect(() => {
		if (!isListening || accessMode !== "voice") return;
		const iv = setInterval(() => {
			if (latestTextRef.current && !isPlayingRef.current && !isSending) {
				const text = latestTextRef.current;
				latestTextRef.current = "";
				setInput(text);
				// Trigger send via ref
				setTimeout(() => {
					const btn = document.querySelector('[aria-label="Enviar"]') as HTMLButtonElement;
					if (btn) btn.click();
				}, 100);
			}
		}, 2000);
		return () => clearInterval(iv);
	}, [isListening, accessMode, isSending]);

	// Start/stop listening when voice mode changes
	useEffect(() => {
		if (phase !== "habitat") return;
		if (accessMode === "voice" && !isListening) startListening();
		else if (accessMode !== "voice" && isListening) stopListening();
	}, [accessMode, phase]);

	// Scroll on new messages
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [msgs]);

	// Landing → any key or touch → awakening
	useEffect(() => {
		if (phase !== "landing") return;
		const h = () => setPhase("awakening");
		window.addEventListener("keydown", h, { once: true });
		window.addEventListener("pointerdown", h, { once: true });
		return () => { window.removeEventListener("keydown", h); window.removeEventListener("pointerdown", h); };
	}, [phase]);

	// Awakening → Ramona greets
	useEffect(() => {
		if (phase !== "awakening") return;
		let cancelled = false;
		const seq = async () => {
			await new Promise(r => setTimeout(r, 1200));
			if (cancelled) return;
			setMsgs([{ role: "odi", text: "Hola. Estoy aquí.", voice: "ramona", mode: "presence" }]);
			setOrbColor(P.spirit);
			// Speak greeting if audio mode
			if (accessMode !== "text" && accessMode !== "signs") {
				speak("Hola. Estoy aquí.", "ramona");
			}
			await new Promise(r => setTimeout(r, 2000));
			if (cancelled) return;
			// ODI follows up proactively
			setMsgs(prev => [...prev, { role: "odi", text: "¿Cómo estás?", voice: "ramona", mode: "presence" }]);
			if (accessMode !== "text" && accessMode !== "signs") {
				speak("¿Cómo estás?", "ramona");
			}
			await new Promise(r => setTimeout(r, 1000));
			if (cancelled) return;
			setPhase("habitat");
			setTimeout(() => inputRef.current?.focus(), 100);
		};
		seq();
		return () => { cancelled = true; };
	}, [phase, accessMode, speak]);

	// Send message to Chat API
	const send = useCallback(async () => {
		const text = input.trim();
		if (!text || isSending) return;
		setInput("");
		setIsSending(true);
		turnRef.current++;

		setMsgs(prev => [...prev, { role: "user", text }]);

		try {
			const resp = await fetch(CHAT_URL, {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: text, session_id: sessionRef.current, mode: "commerce" }),
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
			}
		} catch {
			setMsgs(prev => [...prev, { role: "odi", text: "No pude conectar. Intenta de nuevo.", voice: "ramona", mode: "care" }]);
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
			{/* Header */}
			<header role="banner" style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<span style={{ fontSize: "0.6rem", letterSpacing: "0.22em", color: P.textDim, fontWeight: 600 }}>O D I</span>
					<span aria-label="Organismo activo" style={{ width: 6, height: 6, borderRadius: "50%", background: P.alive, boxShadow: `0 0 8px ${P.alive}44` }} />
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{isSpeaking && <span style={{ fontSize: "0.5rem", color: P.spirit, animation: "fadeIn 0.3s" }}>hablando...</span>}
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
					transform: hasConvo ? "scale(0.3)" : phase === "awakening" ? "scale(1.08)" : "scale(1)",
					marginBottom: hasConvo ? -16 : 20,
					marginTop: hasConvo ? 4 : 0,
				}}>
					<button onClick={() => { if (phase === "landing") setPhase("awakening"); else if (phase === "habitat") inputRef.current?.focus(); }}
						aria-label="ODI" tabIndex={0}
						style={{
							width: 150, height: 150, borderRadius: "50%",
							background: `radial-gradient(circle at 48% 38%, ${orbColor}dd 0%, ${orbColor}88 28%, ${orbColor}44 52%, ${orbColor}11 75%, transparent 100%)`,
							boxShadow: `0 0 52px ${orbColor}44, inset 0 0 45px ${orbColor}22`,
							border: "none", cursor: "pointer",
							animation: isSpeaking ? "orbSpeak 1.2s ease-in-out infinite" : phase === "landing" ? "orbLanding 3s ease-in-out infinite" : isSending ? "orbSpeak 2s ease-in-out infinite" : "orbBreathe 4s ease-in-out infinite",
							transition: "background 1.5s ease, box-shadow 1.5s ease",
						}}
					/>
				</div>

				{/* Landing */}
				{phase === "landing" && (
					<div style={{ textAlign: "center", animation: "fadeIn 1s ease" }}>
						<p style={{ margin: 0, fontSize: "0.68rem", color: P.textSoft, fontWeight: 400, letterSpacing: "0.04em" }}>
							Organismo Digital Industrial
						</p>
						{referrer && (
							<p style={{ margin: "8px 0 0", fontSize: "0.56rem", color: P.warm, fontWeight: 400, animation: "fadeIn 1.5s ease" }}>
								Recomendado por {referrer}
							</p>
						)}
						<div style={{ marginTop: 32, display: "flex", gap: 16, justifyContent: "center", animation: "fadeIn 2.5s ease" }}>
							{[
								{ icon: "🎙", label: "Voz", mode: "voice" as const },
								{ icon: "⌨", label: "Texto", mode: "text" as const },
								{ icon: "🤟", label: "Señas", mode: "signs" as const },
							].map(door => (
								<button key={door.mode} onClick={() => {
									if (door.mode === "signs") { setAccessMode("signs"); localStorage.setItem("odi_a11y_mode", "signs"); }
									else if (door.mode === "voice") { setAccessMode("voice"); localStorage.setItem("odi_a11y_mode", "voice"); }
									setPhase("awakening");
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
					</div>
				)}

				{/* Awakening */}
				{phase === "awakening" && (
					<div style={{ textAlign: "center", animation: "fadeIn 0.6s ease" }}>
						{msgs.length === 0 && <p style={{ fontSize: "0.62rem", color: P.textFaint }}>...</p>}
						{msgs.map((m, i) => (
							<div key={i} style={{ animation: "fadeIn 0.6s ease" }}>
								<VoiceTag voice={m.voice} />
								<p style={{ margin: "4px 0", fontSize: "1.05rem", fontWeight: 500, color: P.text }}>{m.text}</p>
							</div>
						))}
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
					<div ref={scrollRef} role="log" aria-live="polite"
						style={{ flex: 1, width: "100%", maxWidth: 620, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "4px 0 16px" }}>
						{msgs.map((m, i) => <Bubble key={i} data={m} isODI={m.role === "odi"} />)}
					</div>
				)}
			</main>

			{/* Input — hidden in "voice" only mode */}
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
							<button onClick={() => { if (isListening) stopListening(); else startListening(); }}
								aria-label={isListening ? "Detener microfono" : "Activar microfono"}
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
				*{box-sizing:border-box;margin:0}
				::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${P.textFaint};border-radius:2px}
				::placeholder{color:${P.textDim}}
			`}</style>
		</div>
	);
}
