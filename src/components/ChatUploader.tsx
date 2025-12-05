import { useState, useCallback } from "react";
import { Upload, FileText, Image, FileSpreadsheet, Link2, Send, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "complete" | "error";
}

const ACCEPTED_TYPES = [
  ".xlsx", ".xls", ".csv",  // Spreadsheets
  ".pdf",                    // PDF
  ".jpg", ".jpeg", ".png", ".gif", ".webp",  // Images
  ".zip", ".rar",            // Archives
  ".doc", ".docx",           // Word
  ".txt"                     // Text
];

const getFileIcon = (type: string) => {
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) {
    return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
  }
  if (type.includes("image")) {
    return <Image className="w-5 h-5 text-purple-400" />;
  }
  return <FileText className="w-5 h-5 text-secondary" />;
};

export function ChatUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    const newFile: UploadedFile = {
      name: file.name,
      type: file.type,
      size: file.size,
      status: "uploading"
    };
    
    setFiles(prev => [...prev, newFile]);
    setStatusMessage("Procesando archivo...");

    // Simulate processing
    setTimeout(() => {
      setFiles(prev => prev.map(f => 
        f.name === file.name ? { ...f, status: "processing" } : f
      ));
      setStatusMessage("Validando formato...");
    }, 800);

    setTimeout(() => {
      setFiles(prev => prev.map(f => 
        f.name === file.name ? { ...f, status: "complete" } : f
      ));
      setStatusMessage("Enviado a la lógica de inventarios SRM");
      toast.success(`${file.name} procesado correctamente`);
    }, 2000);

    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleUrlSubmit = () => {
    if (!url.trim()) return;
    
    setStatusMessage("Analizando URL para scraping...");
    toast.info(`Procesando: ${url}`);
    
    setTimeout(() => {
      setStatusMessage("Enviado a la lógica de inventarios SRM");
      setUrl("");
      toast.success("URL enviada para procesamiento");
    }, 2000);

    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleSendMessage = () => {
    if (!message.trim() && files.length === 0) return;
    
    // Placeholder API call
    console.log("Sending to POST https://api.srm-adsi.com/intake", {
      message,
      files: files.map(f => f.name)
    });
    
    toast.success("Mensaje enviado al sistema SRM");
    setMessage("");
  };

  return (
    <section className="relative py-24 z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-4">
              <span className="text-primary">SRM Inteligente</span> — Carga tu Catálogo
            </h2>
            <p className="text-muted-foreground font-subtitle text-lg">
              Carga tus catálogos y SRM los estandariza automáticamente
            </p>
            <p className="text-steel-400 text-sm mt-2">
              Compatible con fabricantes, importadores, distribuidores y talleres
            </p>
          </div>

          {/* Dropzone Area */}
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''} cursor-pointer mb-6`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-subtitle font-semibold text-foreground text-lg">
                  Arrastra y suelta archivos aquí
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Excel, CSV, PDF, Imágenes, ZIP, Word, TXT
                </p>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Pega una URL para scraping (ej: https://proveedor.com/catalogo)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 bg-steel-800 border-steel-700 focus:border-secondary"
              />
            </div>
            <Button 
              onClick={handleUrlSubmit}
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              Analizar
            </Button>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-steel-800/80 border border-steel-700 mb-6 animate-fade-up">
              <Loader2 className="w-5 h-5 text-secondary animate-spin" />
              <span className="text-foreground font-subtitle">{statusMessage}</span>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-3 mb-6">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-steel-800 border border-steel-700"
                >
                  {getFileIcon(file.type)}
                  <span className="flex-1 text-foreground text-sm truncate">{file.name}</span>
                  <span className="text-steel-400 text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  {file.status === "complete" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : file.status === "uploading" || file.status === "processing" ? (
                    <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                  ) : null}
                  <button
                    onClick={() => removeFile(file.name)}
                    className="p-1 hover:bg-steel-700 rounded"
                  >
                    <X className="w-4 h-4 text-steel-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="flex gap-3">
            <Input
              placeholder="Escribe instrucciones adicionales para el procesamiento..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-steel-800 border-steel-700 focus:border-primary"
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* API Endpoint Info */}
          <p className="text-steel-500 text-xs text-center mt-4">
            Endpoint: POST https://api.srm-adsi.com/intake
          </p>
        </div>
      </div>
    </section>
  );
}
