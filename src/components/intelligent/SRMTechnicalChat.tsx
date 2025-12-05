import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Link2, Image, Loader2, Bot, User, FileText, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SRM360Viewer, mockProduct360 } from './SRM360Viewer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'file' | 'image' | 'url';
    name: string;
    url?: string;
  }[];
  actions?: {
    type: 'view360' | 'standardize' | 'fitment';
    label: string;
  }[];
}

const simulatedResponses: Record<string, string> = {
  default: `He analizado tu consulta. Basándome en la terminología técnica SRM y nuestra base de conocimiento unificada, aquí tienes la información:

**Estandarización SRM:**
- Nombre técnico sugerido: Kit de Arrastre 428H-120L
- Categoría: Transmisión > Kits de Arrastre
- Código SRM: SRM-TRN-KIT-428H120

**Fitment detectado:**
Honda CBF 150 (2015-2023), Yamaha YBR 125 (2016-2022)

¿Deseas ver la ficha técnica 360° completa?`,
  standardize: `✅ **Estandarización completada**

**Nombre original:** Kit Cadena Reforzado 428
**Nombre técnico SRM:** Kit de Arrastre 428H-120L

**Correcciones aplicadas:**
- "Cadena" → "Arrastre" (terminología técnica)
- Especificación de paso y eslabones añadida
- Formato unificado según taxonomía SRM`,
  fitment: `🔧 **Análisis de Fitment SRM**

**Compatibilidad confirmada:**
- Honda: CBF 150, CB 190R, XR 150L
- Yamaha: YBR 125, FZ 150, Szr 150
- Suzuki: GN 125, EN 125
- Bajaj: Pulsar 150, Discover 125

**Años:** 2015-2023

**Nota técnica:** Verificar tensión de cadena según manual del fabricante (25-30mm de deflexión).`,
  diagnose: `🔍 **Diagnóstico Técnico SRM**

Basándome en la información proporcionada, el desgaste prematuro puede deberse a:

1. **Tensión incorrecta** - Verificar deflexión de 25-30mm
2. **Lubricación inadecuada** - Aplicar lubricante cada 500km
3. **Desalineación** - Revisar alineación de rueda trasera

**Recomendación:** Reemplazar kit completo (cadena + piñones) para evitar desgaste disparejo.`,
};

export const SRMTechnicalChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `¡Hola! Soy el asistente técnico SRM. Puedo ayudarte con:

• **Estandarización** de nombres de repuestos
• **Fitment** y compatibilidad de piezas
• **Diagnóstico técnico** de componentes
• **Generación de fichas 360°**

Escribe tu consulta o carga un archivo para comenzar.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isViewer360Open, setIsViewer360Open] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate response delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Determine response type based on input
    let responseKey = 'default';
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('estandarizar') || lowerInput.includes('nombre')) {
      responseKey = 'standardize';
    } else if (lowerInput.includes('fitment') || lowerInput.includes('compatible')) {
      responseKey = 'fitment';
    } else if (lowerInput.includes('diagnóstico') || lowerInput.includes('problema') || lowerInput.includes('desgaste')) {
      responseKey = 'diagnose';
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: simulatedResponses[responseKey],
      timestamp: new Date(),
      actions: [
        { type: 'view360', label: 'Ver Ficha 360°' },
        { type: 'standardize', label: 'Estandarizar' },
      ],
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const file = files[0];
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `He cargado el archivo: ${file.name}`,
      timestamp: new Date(),
      attachments: [
        {
          type: file.type.includes('image') ? 'image' : 'file',
          name: file.name,
        },
      ],
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate processing
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `📁 **Archivo recibido:** ${file.name}

Procesando contenido...

✅ **Análisis completado:**
- Tipo: ${file.type || 'documento'}
- Se detectaron 47 productos
- 12 requieren estandarización
- 35 ya tienen formato SRM

¿Deseas procesar estos productos con el pipeline SRM completo?`,
        timestamp: new Date(),
        actions: [
          { type: 'view360', label: 'Ver Ficha 360°' },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);

    e.target.value = '';
  };

  const handleAction = (action: { type: string; label: string }) => {
    if (action.type === 'view360') {
      setIsViewer360Open(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="flex flex-col h-[600px] bg-card border border-steel-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-steel-700 bg-steel-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-subtitle font-semibold text-foreground">SRM Technical Chat</h3>
            <p className="text-xs text-muted-foreground">Asistente técnico inteligente</p>
          </div>
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
            En línea
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
                    max-w-[80%] rounded-2xl px-4 py-3
                    ${message.role === 'user' 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-steel-800 border border-steel-700'}
                  `}
                >
                  {message.attachments?.map((attachment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 mb-2 p-2 bg-steel-700/50 rounded-lg"
                    >
                      {attachment.type === 'image' ? (
                        <Image className="w-4 h-4 text-primary" />
                      ) : (
                        <FileText className="w-4 h-4 text-secondary" />
                      )}
                      <span className="text-sm text-muted-foreground">{attachment.name}</span>
                    </div>
                  ))}

                  <div className="text-sm text-foreground whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-1 last:mb-0">
                        {line.split('**').map((part, j) => 
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </p>
                    ))}
                  </div>

                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-steel-700">
                      {message.actions.map((action, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAction(action)}
                        >
                          {action.type === 'view360' && <Eye className="w-3 h-3 mr-1" />}
                          {action.type === 'standardize' && <Sparkles className="w-3 h-3 mr-1" />}
                          {action.label}
                        </Button>
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
              onChange={handleFileUpload}
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
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu consulta técnica..."
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

          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-steel-700">
              <FileText className="w-3 h-3 mr-1" />
              Archivos
            </Badge>
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-steel-700">
              <Image className="w-3 h-3 mr-1" />
              Imágenes
            </Badge>
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-steel-700">
              <Link2 className="w-3 h-3 mr-1" />
              URLs
            </Badge>
          </div>
        </div>
      </div>

      <SRM360Viewer
        isOpen={isViewer360Open}
        onClose={() => setIsViewer360Open(false)}
        product={mockProduct360}
      />
    </>
  );
};

export default SRMTechnicalChat;
