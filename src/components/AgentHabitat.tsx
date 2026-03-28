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

interface Manifest {
	capabilities: Record<string, boolean>;
	services: Record<string, { port: number; status: string }>;
	context: Record<string, string>;
}

type Phase = "idle" | "connecting" | "registering" | "live" | "offline";

// ── Constants ──
const WS_URLS = [
	"wss://ws.liveodi.com",
	"wss://api.liveodi.com/ws/vivir",
	"ws://localhost:8765",
];
const HEARTBEAT_MS = 12_000;
const RECONNECT_MS = 4_000;
const MAX_EVENTS = 60;

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

const SOURCE_COLORS: Record<string, string> = {
	agent: "#49c2ff",
	chat: "#3af08f",
	pipeline: "#ffcc00",
	test: "#c084fc",
	radar: "#f97316",
};

// ── Component ──
export function AgentHabitat() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [events, setEvents] = useState<AgentEvent[]>([]);
	const [manifest, setManifest] = useState<Manifest | null>(null);
	const [showManifest, setShowManifest] = useState(false);
	const [returnVisit] = useState(isReturn);
	const [heartbeats, setHeartbeats] = useState(0);
	const [wsUrlIdx, setWsUrlIdx] = useState(0);

	const wsRef = useRef<WebSocket | null>(null);
	const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const reconRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const sessionRef = useRef(
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `sess_${Date.now().toString(36)}`
	);
	const deviceRef = useRef("ssr");
	const mountedRef = useRef(true);
	const urlIdxRef = useRef(0);

	// ── pushEvent ──
	const pushEvent = useCallback((ev: AgentEvent) => {
		setEvents((prev) => [ev, ...prev].slice(0, MAX_EVENTS));
	}, []);

	// ── cleanup ──
	const cleanup = useCallback(() => {
		if (hbRef.current) clearInterval(hbRef.current);
		if (reconRef.current) clearTimeout(reconRef.current);
		hbRef.current = null;
		reconRef.current = null;
	}, []);

	// ── connect ──
	const connect = useCallback(() => {
		cleanup();
		if (!mountedRef.current) return;

		const url = WS_URLS[urlIdxRef.current];
		setPhase("connecting");

		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			if (!mountedRef.current) { ws.close(); return; }
			setPhase("registering");
			setWsUrlIdx(urlIdxRef.current);

			ws.send(JSON.stringify({
				type: "register",
				device_id: deviceRef.current,
				session_id: sessionRef.current,
				device_info: {
					platform: navigator.platform || "unknown",
					language: navigator.language || "es",
					user_agent: navigator.userAgent,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					screen: {
						width: window.screen?.width,
						height: window.screen?.height,
					},
				},
			}));

			// heartbeat
			hbRef.current = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: "heartbeat" }));
				}
			}, HEARTBEAT_MS);
		};

		ws.onmessage = (e) => {
			if (!mountedRef.current) return;
			try {
				const msg = JSON.parse(e.data);

				if (msg.type === "manifest") {
					setManifest(msg.manifest || null);
					setPhase("live");
					pushEvent({
						event_id: msg.session_id || "manifest",
						ts: msg.ts || new Date().toISOString(),
						source: "agent",
						type: "manifest",
						payload: { text: "Manifest recibido" },
						system_action: { type: "manifest", status: "Habitat conectado" },
					});
					return;
				}

				if (msg.type === "heartbeat_ack") {
					setHeartbeats((n) => n + 1);
					return;
				}

				// Any other message is an event
				const ev: AgentEvent = {
					event_id: msg.event_id || `ev_${Date.now()}`,
					ts: msg.ts || new Date().toISOString(),
					source: msg.source || "unknown",
					type: msg.type || "event",
					level: msg.level,
					voice: msg.voice,
					mode: msg.mode,
					payload: msg.payload,
					system_action: msg.system_action,
				};
				pushEvent(ev);
			} catch { /* ignore malformed */ }
		};

		ws.onclose = () => {
			if (!mountedRef.current) return;
			cleanup();
			setPhase("offline");

			// try next URL on failure, cycle back
			urlIdxRef.current = (urlIdxRef.current + 1) % WS_URLS.length;
			reconRef.current = setTimeout(() => {
				if (mountedRef.current) connect();
			}, RECONNECT_MS);
		};

		ws.onerror = () => {
			ws.close();
		};
	}, [cleanup, pushEvent]);

	// ── lifecycle ──
	useEffect(() => {
		mountedRef.current = true;
		deviceRef.current = getDeviceId();
		connect();

		return () => {
			mountedRef.current = false;
			cleanup();
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [connect, cleanup]);

	// ── flame color by phase ──
	const flameGradient: Record<Phase, string> = {
		idle: "radial-gradient(circle at 50% 35%, #666 0%, #444 50%, transparent 100%)",
		connecting: "radial-gradient(circle at 50% 35%, #ffcc00 0%, #ff8800 50%, transparent 100%)",
		registering: "radial-gradient(circle at 50% 35%, #ffcc00 0%, #ff8800 50%, transparent 100%)",
		live: "radial-gradient(circle at 50% 35%, #9be2ff 0%, #49c2ff 32%, #6f6dff 65%, rgba(111,109,255,0.1) 82%, transparent 100%)",
		offline: "radial-gradient(circle at 50% 35%, #ff4444 0%, #cc0000 50%, transparent 100%)",
	};

	const flameShadow: Record<Phase, string> = {
		idle: "0 0 20px #44444488",
		connecting: "0 0 30px #ffcc0088",
		registering: "0 0 30px #ffcc0088",
		live: "0 0 38px #4ab8ffaa, inset 0 0 35px #b8d8ff70",
		offline: "0 0 30px #ff444488",
	};

	const statusLabel: Record<Phase, string> = {
		idle: "Inactivo",
		connecting: "Conectando...",
		registering: "Registrando...",
		live: "Habitat vivo",
		offline: "Modo offline — reconectando...",
	};

	const statusDot: Record<Phase, string> = {
		idle: "bg-[#444]",
		connecting: "bg-[#ffcc00] animate-pulse",
		registering: "bg-[#ffcc00] animate-pulse",
		live: "bg-[#3af08f] shadow-[0_0_12px_#3af08fcc] animate-pulse",
		offline: "bg-[#ff4444] animate-pulse",
	};

	return (
		<main className="min-h-screen bg-[#03070d] text-[#dbe7ff] font-sans">
			<div className="max-w-[1100px] mx-auto min-h-screen px-4 py-5">

				{/* ── Header ── */}
				<header className="flex items-center justify-between gap-3 mb-6">
					<div className="flex items-center gap-3">
						<span className="text-sm tracking-[0.22em] text-[#7f95bb]">LIVEODI</span>
						{returnVisit && (
							<span className="text-xs px-2 py-0.5 rounded-full bg-[#6f6dff22] text-[#b8b6ff] border border-[#6f6dff44]">
								retorno
							</span>
						)}
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm text-[#b6e5ff] opacity-90">{statusLabel[phase]}</span>
						<span className={`w-2.5 h-2.5 rounded-full ${statusDot[phase]}`} />
					</div>
				</header>

				{/* ── Grid: Flame + Events + Sidebar ── */}
				<div className="grid gap-6" style={{ gridTemplateColumns: showManifest ? "1fr 2fr 280px" : "1fr 2fr", gridTemplateRows: "auto 1fr" }}>

					{/* ── Flame ── */}
					<section className="flex flex-col items-center justify-start pt-8">
						<div
							className="w-32 h-32 rounded-full"
							style={{
								background: flameGradient[phase],
								boxShadow: flameShadow[phase],
								animation: phase === "live" ? "breathe 4s ease-in-out infinite" : "none",
								transition: "box-shadow 0.6s, background 0.6s",
							}}
						/>
						<p className="text-xs text-[#7f95bb] mt-4 text-center">
							{phase === "live" && heartbeats > 0 && `${heartbeats} latidos`}
						</p>
						{phase === "live" && (
							<button
								onClick={() => setShowManifest((v) => !v)}
								className="mt-3 text-xs text-[#49c2ff] hover:text-[#9be2ff] transition-colors cursor-pointer bg-transparent border-none"
							>
								{showManifest ? "Ocultar manifest" : "Ver manifest"}
							</button>
						)}
						<p className="text-[10px] text-[#4a5f7f] mt-2">
							{WS_URLS[wsUrlIdx]?.replace("wss://", "").replace("ws://", "")}
						</p>
					</section>

					{/* ── Event Stream ── */}
					<section className="overflow-y-auto max-h-[75vh] pr-2">
						<h2 className="text-xs tracking-[0.18em] text-[#7f95bb] mb-3">EVENTOS</h2>
						{events.length === 0 && phase !== "live" && (
							<p className="text-sm text-[#4a5f7f]">Esperando conexion...</p>
						)}
						{events.length === 0 && phase === "live" && (
							<p className="text-sm text-[#4a5f7f]">Conectado. Esperando impulsos...</p>
						)}
						<div className="grid gap-2">
							{events.map((ev) => (
								<article
									key={ev.event_id}
									className="rounded-lg border border-[#1a2a42] bg-[#0a1628] px-4 py-3"
									style={{ animation: "fadeIn 0.3s ease-out" }}
								>
									<div className="flex items-center gap-2 mb-1">
										<span
											className="text-xs font-semibold px-1.5 py-0.5 rounded"
											style={{
												color: SOURCE_COLORS[ev.source] || "#7f95bb",
												backgroundColor: `${SOURCE_COLORS[ev.source] || "#7f95bb"}18`,
											}}
										>
											{ev.source}
										</span>
										<span className="text-xs text-[#4a5f7f]">{ev.type}</span>
										{ev.voice && <span className="text-xs text-[#4a5f7f]">({ev.voice})</span>}
										{ev.mode && <span className="text-xs text-[#4a5f7f]">{ev.mode}</span>}
										<span className="text-xs text-[#3a4f6f] ml-auto">{timeAgo(ev.ts)}</span>
									</div>
									{ev.system_action?.status && (
										<p className="text-sm text-[#b6e5ff] mb-1">{ev.system_action.status}</p>
									)}
									{ev.payload?.text && (
										<p className="text-sm text-[#8ca0c6]">{ev.payload.text}</p>
									)}
								</article>
							))}
						</div>
					</section>

					{/* ── Manifest Sidebar ── */}
					{showManifest && manifest && (
						<aside className="overflow-y-auto max-h-[75vh] rounded-lg border border-[#1a2a42] bg-[#0a1628] p-4">
							<h3 className="text-xs tracking-[0.18em] text-[#7f95bb] mb-3">MANIFEST</h3>

							<div className="mb-4">
								<h4 className="text-xs text-[#49c2ff] mb-2">Capabilities</h4>
								<div className="grid gap-1">
									{Object.entries(manifest.capabilities).map(([k, v]) => (
										<div key={k} className="flex items-center gap-2 text-xs">
											<span className={v ? "text-[#3af08f]" : "text-[#4a5f7f]"}>{v ? "\u25CF" : "\u25CB"}</span>
											<span className="text-[#8ca0c6]">{k}</span>
										</div>
									))}
								</div>
							</div>

							<div className="mb-4">
								<h4 className="text-xs text-[#49c2ff] mb-2">Services</h4>
								<div className="grid gap-1">
									{Object.entries(manifest.services).map(([k, v]) => (
										<div key={k} className="flex items-center justify-between text-xs">
											<span className="text-[#8ca0c6]">{k}</span>
											<span className="text-[#3af08f]">:{v.port}</span>
										</div>
									))}
								</div>
							</div>

							<div>
								<h4 className="text-xs text-[#49c2ff] mb-2">Context</h4>
								<div className="grid gap-1">
									{Object.entries(manifest.context).map(([k, v]) => (
										<div key={k} className="text-xs">
											<span className="text-[#4a5f7f]">{k}: </span>
											<span className="text-[#8ca0c6]">{v}</span>
										</div>
									))}
								</div>
							</div>

							<div className="mt-4 pt-3 border-t border-[#1a2a42] text-[10px] text-[#4a5f7f]">
								<p>device: {deviceRef.current}</p>
								<p>session: {sessionRef.current.slice(0, 12)}...</p>
							</div>
						</aside>
					)}
				</div>
			</div>
		</main>
	);
}
