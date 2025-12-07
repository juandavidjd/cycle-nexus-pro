import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Copy, Check, RotateCcw, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Validation constants
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 50;
const THROTTLE_MS = 1000;

// Validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(MAX_MESSAGE_LENGTH),
});

const requestSchema = z.object({
  agentType: z.enum(['voice', 'designer', 'instructor', 'sales', 'architect']),
  userMessage: z.string().min(1, 'El mensaje no puede estar vacío').max(MAX_MESSAGE_LENGTH, `Máximo ${MAX_MESSAGE_LENGTH} caracteres`),
  conversationHistory: z.array(messageSchema).max(MAX_HISTORY_MESSAGES),
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentChatProps {
  agentType: string;
  agentName: string;
  placeholder: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/srm-agents`;

export const AgentChat: React.FC<AgentChatProps> = ({ agentType, agentName, placeholder }) => {
  const { user, session, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !session) return;

    // Throttle: prevent rapid submissions
    const now = Date.now();
    if (now - lastSubmitTime < THROTTLE_MS) {
      toast.error('Por favor espera un momento antes de enviar otro mensaje');
      return;
    }
    setLastSubmitTime(now);

    // Trim conversation history to prevent unbounded growth
    const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES);

    // Validate input before sending
    const validationResult = requestSchema.safeParse({
      agentType,
      userMessage: input.trim(),
      conversationHistory: trimmedHistory,
    });

    if (!validationResult.success) {
      const error = validationResult.error.errors[0];
      toast.error(error.message || 'Mensaje inválido');
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev.slice(-MAX_HISTORY_MESSAGES + 1), userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(validationResult.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, lastSubmitTime, messages, agentType, session]);

  const clearChat = () => {
    setMessages([]);
    toast.success('Conversación reiniciada');
  };

  // Show auth required message if not logged in
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-background border border-border rounded-lg p-8 text-center">
        <LogIn className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-foreground text-lg mb-2">Inicia sesión para usar los agentes</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Los agentes de IA de SRM requieren autenticación para proteger el acceso y garantizar un uso responsable.
        </p>
        <Link to="/auth">
          <Button className="gap-2">
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground">{agentName}</h3>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reiniciar
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
            <p>{placeholder}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  {msg.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -bottom-8 right-0 h-7 text-xs"
                      onClick={() => copyToClipboard(msg.content, i)}
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copiar
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder="Escribe tu solicitud..."
              className="min-h-[60px] max-h-[120px] resize-none pr-16"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <span className={`absolute bottom-2 right-2 text-xs ${input.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {input.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <Button type="submit" disabled={isLoading || !input.trim() || input.length > MAX_MESSAGE_LENGTH} className="self-end">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};
