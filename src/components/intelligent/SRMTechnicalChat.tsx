import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Bot, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  odiChat,
  getSessionId,
  formatPriceCOP,
  PLACEHOLDER_IMG,
  type ODIProduct,
  type ODIChatResponse,
} from '@/lib/odiApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  productos?: ODIProduct[];
  follow?: string | null;
}

// ─── Skin Engine: apply data-attributes to <html> ───

function applySkinAttributes(data: ODIChatResponse) {
  const root = document.documentElement;
  if (data.industry) root.setAttribute("data-industry", data.industry);
  if (data.mode) root.setAttribute("data-mode", data.mode);
  if (data.voice) root.setAttribute("data-voice", data.voice);
  if (data.guardian_color) root.setAttribute("data-guardian", data.guardian_color);
}

export const SRMTechnicalChat = () => {
  const [sessionId] = useState(() => getSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Conectado al ecosistema ODI — datos reales.

Puedo ayudarte con:
- Buscar repuestos por nombre, SKU o descripcion
- Compatibilidad y fitment de piezas
- Informacion de proveedores

Escribe tu consulta para comenzar.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const data = await odiChat(query, sessionId);

      // Apply Skin Engine data-attributes
      applySkinAttributes(data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sin respuesta del servidor.',
        timestamp: new Date(),
        productos: data.productos && data.productos.length > 0 ? data.productos : undefined,
        follow: data.follow,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error conectando con ODI: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card border border-steel-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-steel-700 bg-steel-800/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-subtitle font-semibold text-foreground">SRM Technical Chat</h3>
          <p className="text-xs text-muted-foreground">Conectado a ODI — datos reales</p>
        </div>
        <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50">
          <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
          ODI Live
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'}
                `}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              <div
                className={`
                  max-w-[85%] rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-steel-800 border border-steel-700'}
                `}
              >
                {/* Text content */}
                <div className="text-sm text-foreground whitespace-pre-wrap">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line.split('**').map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>

                {/* Follow-up suggestion */}
                {message.follow && (
                  <p className="text-xs text-secondary mt-2 italic">{message.follow}</p>
                )}

                {/* Product Cards */}
                {message.productos && message.productos.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 mt-3 pt-3 border-t border-steel-700">
                    {message.productos.slice(0, 5).map((product) => (
                      <div
                        key={product.sku}
                        className="flex gap-3 p-3 rounded-xl bg-steel-900/50 border border-steel-700 hover:border-steel-600 transition-colors"
                      >
                        {/* Image */}
                        <img
                          src={product.image || PLACEHOLDER_IMG}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-steel-800"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.from || product.vendor}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm font-semibold text-green-400">
                              {formatPriceCOP(String(product.price))}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {product.store}
                            </Badge>
                          </div>
                        </div>

                        {/* Action */}
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 self-center"
                          >
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Ver producto
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-steel-800 border border-steel-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-steel-700 bg-steel-800/50">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.zip,.doc,.docx,.txt"
          />

          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Busca repuestos, compatibilidad, fichas tecnicas..."
            className="flex-1 bg-steel-900 border-steel-700"
            disabled={isLoading}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SRMTechnicalChat;
