// src/components/habitat/ChatStream.tsx
// Conversacion del habitat. Usa el MISMO odiApi.ts del Paso 1.
// La diferencia es SOLO la UI que lo envuelve.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import {
  odiChat,
  getSessionId,
  type ODIChatResponse,
  type ODIProduct,
} from '@/lib/odiApi';
import { ProductGrid } from './ProductGrid';

interface Message {
  id: string;
  role: 'odi' | 'user';
  text: string;
  productos?: ODIProduct[];
  follow?: string | null;
}

interface ChatStreamProps {
  greeting: string;
  onResponse?: (data: ODIChatResponse) => void;
}

// Apply Skin Engine data-attributes to <html>
function applySkinAttributes(data: ODIChatResponse) {
  const root = document.documentElement;
  if (data.industry) root.setAttribute('data-industry', data.industry);
  if (data.mode) root.setAttribute('data-mode', data.mode);
  if (data.voice) root.setAttribute('data-voice', data.voice);
  if (data.guardian_color) root.setAttribute('data-guardian', data.guardian_color);
}

export function ChatStream({ greeting, onResponse }: ChatStreamProps) {
  const [sessionId] = useState(() => getSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ODI INICIA. ODI EMPUJA. ODI NUNCA ESPERA.
  useEffect(() => {
    const t1 = setTimeout(() => {
      setMessages([{ id: 'g1', role: 'odi', text: greeting }]);
    }, 800);

    const t2 = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: 'g2', role: 'odi', text: '¿Qué necesitas?' },
      ]);
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [greeting]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await odiChat(text, sessionId);

      // Apply skin attributes
      applySkinAttributes(data);

      // Notify parent (for Orb color changes)
      onResponse?.(data);

      setMessages((prev) => [
        ...prev,
        {
          id: `o-${Date.now()}`,
          role: 'odi',
          text: data.response || '',
          productos:
            data.productos && data.productos.length > 0
              ? data.productos
              : undefined,
          follow: data.follow,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'odi', text: `Error: ${msg}` },
      ]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  }, [input, isLoading, sessionId, onResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto" style={{ minHeight: 0 }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%]"
              style={{
                ...(msg.role === 'user'
                  ? {}
                  : {}),
              }}
            >
              {/* Text */}
              <p
                className="text-base leading-relaxed"
                style={{
                  color: msg.role === 'odi' ? '#c8d6e5' : '#8ab4d8',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                {msg.text}
              </p>

              {/* Follow-up */}
              {msg.follow && (
                <p
                  className="text-sm mt-1 italic"
                  style={{ color: '#4a6585' }}
                >
                  {msg.follow}
                </p>
              )}

              {/* Products */}
              {msg.productos && msg.productos.length > 0 && (
                <div className="mt-3">
                  <ProductGrid productos={msg.productos} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: '#4a6585' }}
              />
              <span className="text-sm" style={{ color: '#4a6585' }}>
                procesando...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 border"
          style={{
            background: 'rgba(11,22,37,0.6)',
            borderColor: 'rgba(74,101,133,0.2)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-40"
            style={{ color: '#c8d6e5' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-2 rounded-full transition-opacity disabled:opacity-20"
            style={{ color: '#4a6585' }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatStream;
