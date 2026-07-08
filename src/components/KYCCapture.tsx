/**
 * KYCCapture — Captura de identidad browser-first
 * Gate 2: documento (cédula / passport / ID)
 * Gate 3: selfie del rostro
 *
 * DOCTRINA: getUserMedia en browser = funciona para todos.
 * Desktop Bridge = mejora para quien lo tenga.
 * No instalar nada para pasar los gates.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { ODI_API } from "@/lib/odiApi";

// ─── tipos ───────────────────────────────────────────────────────────────────

type KYCType = "documento" | "selfie";

type KYCState =
  | "idle"
  | "requesting_camera"
  | "preview"
  | "capturing"
  | "uploading"
  | "done"
  | "error"
  | "fallback";  // sin cámara → input file

interface KYCCaptureProps {
  type: KYCType;
  token: string;                          // registration_token del P10/T10
  onSuccess: (sessionId: string) => void;
  onError?: (error: string) => void;
}

// ─── copias ES ───────────────────────────────────────────────────────────────

const COPY = {
  documento: {
    title: "Documento de identidad",
    instruction: "Coloca tu cédula, pasaporte o ID dentro del marco. Asegúrate de que se lea claramente.",
    frameLabel: "Marco documento",
    captureBtn: "Capturar documento",
    retakeBtn: "Tomar otra foto",
    confirmBtn: "Confirmar documento",
    fallbackLabel: "Subir foto del documento",
    successMsg: "Documento capturado correctamente",
  },
  selfie: {
    title: "Foto del rostro",
    instruction: "Centra tu rostro dentro del óvalo. Asegúrate de tener buena iluminación.",
    frameLabel: "Marco selfie",
    captureBtn: "Capturar selfie",
    retakeBtn: "Tomar otra",
    confirmBtn: "Confirmar selfie",
    fallbackLabel: "Subir foto del rostro",
    successMsg: "Selfie capturado correctamente",
  },
} as const;

const GATE_NUMBER = { documento: 2, selfie: 3 } as const;

// ─── componente ──────────────────────────────────────────────────────────────

export default function KYCCapture({ type, token, onSuccess, onError }: KYCCaptureProps) {
  const copy = COPY[type];
  const gate = GATE_NUMBER[type];

  const [state, setState] = useState<KYCState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [capturedData, setCapturedData] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setState("error");
    onError?.(msg);
  }, [onError]);

  // ── 1. Solicitar cámara ──────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setState("requesting_camera");
    try {
      // Selfie: cámara frontal. Documento: trasera o cualquiera.
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: type === "selfie" ? "user" : { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("preview");
    } catch (err: any) {
      // Permiso denegado u otro error → fallback a file input
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setState("fallback");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        setState("fallback");
      } else {
        setState("fallback");
      }
    }
  }, [type]);

  // ── 2. Capturar frame ────────────────────────────────────────────────────

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setState("capturing");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Espejo para selfie (el video se muestra en espejo, el canvas también)
    if (type === "selfie") {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedData(dataUrl);
    setPreviewSrc(dataUrl);
    stopStream();
    setState("preview");
  }, [type, stopStream]);

  // ── 3. Subir al servidor ─────────────────────────────────────────────────

  const uploadCapture = useCallback(async (data: string) => {
    if (!data) return;
    setState("uploading");

    try {
      // Detectar si el Desktop Bridge está disponible como enhancement
      const bridgeAvailable = typeof (window as any).__TAURI__ !== "undefined" &&
        typeof (window as any).__TAURI__?.core?.invoke === "function";

      let sessionId: string;

      if (bridgeAvailable) {
        // Enhancement: usar Tauri invoke (mejor calidad, sin CORS)
        const invoke = (window as any).__TAURI__.core.invoke;
        const result = await invoke("upload_kyc_photo", {
          gate,
          imageData: data,
          deviceId: "",
          registrationToken: token,
        });
        sessionId = result.session_id;
      } else {
        // Browser-first: POST directo a api.liveodi.com
        const res = await fetch(`${ODI_API}/odi/v1/kyc/capture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gate,
            image_data: data,
            registration_token: token,
            source: "web",
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body}`);
        }

        const json = await res.json();
        sessionId = json.session_id;
      }

      setState("done");
      onSuccess(sessionId);
    } catch (err: any) {
      handleError(err?.message || "Error subiendo imagen");
    }
  }, [gate, token, onSuccess, handleError]);

  // ── Fallback: input file ─────────────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setCapturedData(data);
      setPreviewSrc(data);
      uploadCapture(data);
    };
    reader.readAsDataURL(file);
  }, [uploadCapture]);

  const retake = useCallback(() => {
    setCapturedData("");
    setPreviewSrc("");
    setErrorMsg("");
    startCamera();
  }, [startCamera]);

  // ─── render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto select-none">

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-blue-400 text-xs tracking-widest uppercase font-semibold">
          Gate {gate}
        </span>
        <span className="text-gray-300 text-sm font-medium">{copy.title}</span>
      </div>

      {/* ── idle ── */}
      {state === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-gray-400 text-sm leading-relaxed">{copy.instruction}</p>
          <button
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm tracking-wide transition-colors"
            onClick={startCamera}
          >
            Abrir cámara
          </button>
          <button
            className="w-full py-2 border border-gray-600 text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-colors"
            onClick={() => setState("fallback")}
          >
            Subir archivo en cambio
          </button>
        </div>
      )}

      {/* ── requesting_camera ── */}
      {state === "requesting_camera" && (
        <div className="flex items-center justify-center h-48 rounded-xl border border-blue-500/20 bg-black/30">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Abriendo cámara...</span>
          </div>
        </div>
      )}

      {/* ── preview (cámara activa o frame capturado) ── */}
      {(state === "preview" || state === "capturing") && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">

            {/* Video live (solo si no hay preview estático aún) */}
            {!previewSrc && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={type === "selfie" ? { transform: "scaleX(-1)" } : undefined}
              />
            )}

            {/* Preview estático post-captura */}
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
            )}

            {/* Marco guía (solo mientras cámara activa) */}
            {!previewSrc && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {type === "documento" ? (
                  <div
                    className="border-2 border-blue-400/80 rounded-lg"
                    style={{ width: "82%", height: "58%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
                    aria-label={copy.frameLabel}
                  />
                ) : (
                  <div
                    className="border-2 border-blue-400/80 rounded-full"
                    style={{ width: "60%", aspectRatio: "1", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
                    aria-label={copy.frameLabel}
                  />
                )}
              </div>
            )}
          </div>

          {/* Instrucción contextual */}
          {!previewSrc && (
            <p className="text-gray-400 text-xs text-center">{copy.instruction}</p>
          )}

          {/* Botones */}
          {!previewSrc ? (
            <button
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm tracking-wide transition-colors"
              onClick={captureFrame}
            >
              {copy.captureBtn}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                className="w-full py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold text-sm tracking-wide transition-colors"
                onClick={() => uploadCapture(capturedData)}
              >
                {copy.confirmBtn}
              </button>
              <button
                className="w-full py-2 border border-gray-600 text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-colors"
                onClick={retake}
              >
                {copy.retakeBtn}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── uploading ── */}
      {state === "uploading" && (
        <div className="flex items-center justify-center h-32 rounded-xl border border-blue-500/20 bg-black/30">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Verificando...</span>
          </div>
        </div>
      )}

      {/* ── done ── */}
      {state === "done" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/20 border border-green-500/30">
          <span className="text-green-400 text-xl">✓</span>
          <p className="text-green-300 text-sm font-medium">{copy.successMsg}</p>
        </div>
      )}

      {/* ── error ── */}
      {state === "error" && (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-red-900/20 border border-red-500/30">
          <p className="text-red-300 text-sm">{errorMsg}</p>
          <button
            className="w-full py-2 border border-gray-600 text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-colors"
            onClick={() => { setErrorMsg(""); setState("idle"); }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── fallback: input file ── */}
      {state === "fallback" && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-yellow-900/10 border border-yellow-500/20">
            <p className="text-yellow-300 text-xs mb-3">
              Cámara no disponible. Puedes subir una foto del{" "}
              {type === "documento" ? "documento" : "rostro"} directamente.
            </p>
            <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:border-blue-500/60 transition-colors">
              <span className="text-gray-400 text-2xl">📎</span>
              <span className="text-gray-400 text-sm">{copy.fallbackLabel}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture={type === "selfie" ? "user" : "environment"}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <button
            className="w-full py-2 border border-gray-600 text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-colors"
            onClick={startCamera}
          >
            Intentar cámara de nuevo
          </button>
        </div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
