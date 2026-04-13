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
	const [ephemeral, setEphemeral] = useState<EphemeralData | null>(null);
	const [ephProducts, setEphProducts] = useState<any[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const sessionRef = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}`);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const isPlayingRef = useRef(false);
	const hasConvo = msgs.length > 0 && phase === "habitat";

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
			await new Promise(r => setTimeout(r, 1500));
			if (cancelled) return;
			setPhase("habitat");
			setTimeout(() => inputRef.current?.focus(), 100);
		};
		seq();
		return () => { cancelled = true; };
	}, [phase]);

	// TTS
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

	// Send message to Chat API
	const send = useCallback(async () => {
		const text = input.trim();
		if (!text || isSending) return;
		setInput("");
		setIsSending(true);

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

				// Auto-speak
				speak(responseText, voice);
			}
		} catch {
			setMsgs(prev => [...prev, { role: "odi", text: "No pude conectar. Intenta de nuevo.", voice: "ramona", mode: "care" }]);
		}
		setIsSending(false);
	}, [input, isSending, speak]);

	return (
		<div lang="es" style={{
			minHeight: "100vh",
			background: `radial-gradient(ellipse at 50% 15%, ${P.deep} 0%, ${P.void} 65%)`,
			color: P.text, fontFamily: "'DM Sans', system-ui, sans-serif",
			display: "flex", flexDirection: "column", overflow: "hidden",
		}}>
			{/* Header */}
			<header style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<span style={{ fontSize: "0.6rem", letterSpacing: "0.22em", color: P.textDim, fontWeight: 600 }}>O D I</span>
					<span style={{ width: 6, height: 6, borderRadius: "50%", background: P.alive, boxShadow: `0 0 8px ${P.alive}44` }} />
				</div>
				{isSpeaking && <span style={{ fontSize: "0.5rem", color: P.spirit, animation: "fadeIn 0.3s" }}>hablando...</span>}
			</header>

			{/* Main */}
			<main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: hasConvo ? "flex-start" : "center", padding: "0 16px", transition: "all 0.6s ease" }}>
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
							animation: isSpeaking ? "orbSpeak 1.5s ease-in-out infinite" : "orbBreathe 5s ease-in-out infinite",
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
						<div style={{ marginTop: 32, display: "flex", gap: 16, justifyContent: "center", animation: "fadeIn 2.5s ease" }}>
							{["🎙 Voz", "⌨ Texto", "🤟 Señas"].map((h, i) => (
								<button key={i} onClick={() => setPhase("awakening")}
									style={{ background: "transparent", border: "none", color: P.textDim, fontSize: "0.6rem", cursor: "pointer", fontFamily: "inherit", padding: "8px 12px", transition: "color 0.3s" }}>
									{h}
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

				{/* Habitat — conversation */}
				{phase === "habitat" && hasConvo && (
					<div ref={scrollRef} role="log" aria-live="polite"
						style={{ flex: 1, width: "100%", maxWidth: 620, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "4px 0 16px" }}>
						{msgs.map((m, i) => <Bubble key={i} data={m} isODI={m.role === "odi"} />)}
					</div>
				)}
			</main>

			{/* Input */}
			{phase === "habitat" && (
				<footer style={{ padding: "10px 16px 20px", maxWidth: 620, width: "100%", margin: "0 auto" }}>
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
				@keyframes orbBreathe { 0%,100%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.05);filter:brightness(1.12)}70%{transform:scale(0.98);filter:brightness(0.95)} }
				@keyframes orbSpeak { 0%,100%{transform:scale(1);filter:brightness(1.1)}50%{transform:scale(1.12);filter:brightness(1.25)} }
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
