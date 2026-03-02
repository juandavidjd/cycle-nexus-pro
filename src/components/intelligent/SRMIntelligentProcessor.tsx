import { useState, useCallback, useRef } from 'react';
import { Upload, Link2, Trash2, Play, Eye, FileSpreadsheet, FileText, Image, Archive, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SRMPipelineVisual } from './SRMPipelineVisual';
import { SRM360Viewer, type Product360Data } from './SRM360Viewer';
import odiApi, { type ODIProductLegacy as ODIProduct } from '@/lib/odiApi';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

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
  const [processedProducts, setProcessedProducts] = useState<ODIProduct[]>([]);
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

  const handlePipelineComplete = async () => {
    try {
      const searchTerms = files.map(f => f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')).join(' ');
      const query = searchTerms || url || 'repuestos moto';
      const results = await odiApi.searchProducts(query, 10);
      setProcessedProducts(results.products);
    } catch {
      setProcessedProducts([]);
    }
    setIsProcessing(false);
    setIsComplete(true);
  };

  const handleView360 = async (product: ODIProduct) => {
    try {
      const data = await odiApi.getProduct360(product.sku);
      setSelectedProduct(data as Product360Data);
    } catch {
      setSelectedProduct({
        technicalName: product.nombre,
        srmCode: product.sku,
        category: product.categoria,
        proveedor: product.proveedor,
        precio_cop: product.precio_cop,
      });
    }
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
              Arrastra y suelta archivos aqui
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Excel', 'CSV', 'PDF', 'Imagenes', 'ZIP', 'Word', 'TXT'].map((format) => (
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
            Procesar Catalogo
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
                Productos Encontrados ({processedProducts.length})
              </h4>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                Datos reales ODI
              </Badge>
            </div>

            <div className="rounded-xl border border-steel-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-steel-800/50 border-steel-700">
                    <TableHead className="text-muted-foreground">SKU</TableHead>
                    <TableHead className="text-muted-foreground">Nombre</TableHead>
                    <TableHead className="text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-muted-foreground">Proveedor</TableHead>
                    <TableHead className="text-muted-foreground text-right">Precio</TableHead>
                    <TableHead className="text-muted-foreground text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedProducts.map((product) => (
                    <TableRow key={product.sku} className="border-steel-700 hover:bg-steel-800/30">
                      <TableCell className="font-mono text-xs text-primary">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {product.nombre}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {product.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {product.proveedor}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        ${(product.precio_cop || 0).toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView360(product)}
                          className="text-secondary hover:text-secondary hover:bg-secondary/10"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          360
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
