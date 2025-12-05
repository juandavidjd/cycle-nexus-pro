import { useState, useCallback, useRef } from 'react';
import { Upload, Link2, Trash2, Play, Eye, FileSpreadsheet, FileText, Image, Archive, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SRMPipelineVisual } from './SRMPipelineVisual';
import { SRM360Viewer, mockProduct360, Product360Data } from './SRM360Viewer';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface ProcessedProduct {
  codigo: string;
  nombreOriginal: string;
  nombreTecnico: string;
  categoriaSRM: string;
  compatibilidad: string;
  imagenes: number;
}

const mockProcessedProducts: ProcessedProduct[] = [
  {
    codigo: 'SRM-TRN-001',
    nombreOriginal: 'KIT ARRASTRE 428 120',
    nombreTecnico: 'Kit de Arrastre 428H-120L',
    categoriaSRM: 'Transmisión > Kits',
    compatibilidad: 'Honda CBF 150, Yamaha YBR 125',
    imagenes: 3,
  },
  {
    codigo: 'SRM-FRN-002',
    nombreOriginal: 'PASTILLA FRENO DEL',
    nombreTecnico: 'Pastillas de Freno Delanteras Semi-Metálicas',
    categoriaSRM: 'Frenos > Pastillas',
    compatibilidad: 'Universal 125-200cc',
    imagenes: 2,
  },
  {
    codigo: 'SRM-ELE-003',
    nombreOriginal: 'BOBINA ENCENDIDO',
    nombreTecnico: 'Bobina de Encendido CDI 12V',
    categoriaSRM: 'Eléctrico > Encendido',
    compatibilidad: 'Bajaj Pulsar, Discover',
    imagenes: 1,
  },
  {
    codigo: 'SRM-MOT-004',
    nombreOriginal: 'FILTRO ACEITE',
    nombreTecnico: 'Filtro de Aceite Motor HF-134',
    categoriaSRM: 'Motor > Filtración',
    compatibilidad: 'Suzuki GN 125, EN 125',
    imagenes: 2,
  },
  {
    codigo: 'SRM-SUS-005',
    nombreOriginal: 'AMORT TRAS',
    nombreTecnico: 'Amortiguador Trasero Gas 340mm',
    categoriaSRM: 'Suspensión > Amortiguadores',
    compatibilidad: 'Honda Wave, Biz',
    imagenes: 4,
  },
];

const getFileIcon = (type: string) => {
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
  }
  if (type.includes('pdf')) {
    return <FileText className="w-5 h-5 text-red-400" />;
  }
  if (type.includes('image')) {
    return <Image className="w-5 h-5 text-blue-400" />;
  }
  if (type.includes('zip') || type.includes('archive')) {
    return <Archive className="w-5 h-5 text-yellow-400" />;
  }
  return <File className="w-5 h-5 text-steel-400" />;
};

export const SRMIntelligentProcessor = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [processedProducts, setProcessedProducts] = useState<ProcessedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product360Data | null>(null);
  const [isViewer360Open, setIsViewer360Open] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = droppedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClear = () => {
    setFiles([]);
    setUrl('');
    setIsComplete(false);
    setProcessedProducts([]);
  };

  const handleProcess = () => {
    if (files.length === 0 && !url.trim()) return;
    
    setIsProcessing(true);
    setIsComplete(false);
    setProcessedProducts([]);
  };

  const handlePipelineComplete = () => {
    setIsProcessing(false);
    setIsComplete(true);
    setProcessedProducts(mockProcessedProducts);
  };

  const handleView360 = (product: ProcessedProduct) => {
    // In real implementation, fetch actual product data
    setSelectedProduct({
      ...mockProduct360,
      technicalName: product.nombreTecnico,
      originalName: product.nombreOriginal,
      srmCode: product.codigo,
    });
    setIsViewer360Open(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            dropzone cursor-pointer
            ${isDragging ? 'dragging' : ''}
            ${files.length > 0 ? 'active' : ''}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.zip,.doc,.docx,.txt"
          />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-steel-700 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-subtitle font-semibold text-foreground mb-2">
              Arrastra y suelta archivos aquí
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Excel', 'CSV', 'PDF', 'Imágenes', 'ZIP', 'Word', 'TXT'].map((format) => (
                <Badge key={format} variant="outline" className="text-xs">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="O ingresa una URL para scraping..."
              className="pl-10 bg-steel-800 border-steel-700"
            />
          </div>
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-subtitle font-semibold text-foreground">
              Archivos cargados ({files.length})
            </h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-steel-800/50 rounded-lg border border-steel-700"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleProcess}
            disabled={isProcessing || (files.length === 0 && !url.trim())}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Procesar Catálogo
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isProcessing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Pipeline Visual */}
        {(isProcessing || isComplete) && (
          <div className="pt-4">
            <h4 className="font-subtitle font-semibold text-foreground mb-4">
              Pipeline SRM
            </h4>
            <SRMPipelineVisual
              isProcessing={isProcessing}
              onComplete={handlePipelineComplete}
            />
          </div>
        )}

        {/* Results Table */}
        {isComplete && processedProducts.length > 0 && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h4 className="font-subtitle font-semibold text-foreground">
                Productos Procesados ({processedProducts.length})
              </h4>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                ✓ Procesamiento completado
              </Badge>
            </div>

            <div className="rounded-xl border border-steel-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-steel-800/50 border-steel-700">
                    <TableHead className="text-muted-foreground">Código</TableHead>
                    <TableHead className="text-muted-foreground">Nombre Original</TableHead>
                    <TableHead className="text-muted-foreground">Nombre Técnico SRM</TableHead>
                    <TableHead className="text-muted-foreground">Categoría</TableHead>
                    <TableHead className="text-muted-foreground">Compatibilidad</TableHead>
                    <TableHead className="text-muted-foreground text-center">Imgs</TableHead>
                    <TableHead className="text-muted-foreground text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedProducts.map((product) => (
                    <TableRow key={product.codigo} className="border-steel-700 hover:bg-steel-800/30">
                      <TableCell className="font-mono text-xs text-primary">
                        {product.codigo}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.nombreOriginal}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {product.nombreTecnico}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {product.categoriaSRM}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {product.compatibilidad}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {product.imagenes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView360(product)}
                          className="text-secondary hover:text-secondary hover:bg-secondary/10"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ficha 360°
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <SRM360Viewer
        isOpen={isViewer360Open}
        onClose={() => setIsViewer360Open(false)}
        product={selectedProduct}
      />
    </>
  );
};

export default SRMIntelligentProcessor;
