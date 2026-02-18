import { useState } from 'react';
import { ChevronLeft, ChevronRight, Tag, Wrench, Calendar, Car, Layers, FileText, Package, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Product360Data {
  id?: string;
  technicalName: string;
  clientName?: string;
  originalName?: string;
  category?: string;
  subcategory?: string;
  proveedor?: string;
  precio_cop?: number;
  compatible_models?: string;
  attributes?: {
    material?: string;
    mechanicalFunction?: string;
    weight?: string;
    dimensions?: string;
  };
  fitment?: {
    brands: string[];
    models: string[];
    years: string[];
  };
  images?: string[];
  technicalDescription?: string;
  commercialDescription?: string;
  aliases?: string[];
  srmCode?: string;
}

interface SRM360ViewerProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product360Data | null;
}

export const SRM360Viewer = ({ isOpen, onClose, product }: SRM360ViewerProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];

  const nextImage = () => {
    if (images.length > 0) setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length > 0) setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-steel-700 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              {product.srmCode && (
                <Badge variant="outline" className="mb-2 border-primary text-primary">
                  {product.srmCode}
                </Badge>
              )}
              <DialogTitle className="font-display text-2xl text-foreground">
                {product.technicalName}
              </DialogTitle>
              {product.clientName && (
                <p className="text-muted-foreground mt-1">{product.clientName}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {product.precio_cop != null && product.precio_cop > 0 && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {product.precio_cop.toLocaleString('es-CO')} COP
                  </Badge>
                )}
                {product.proveedor && (
                  <Badge variant="outline" className="text-xs">
                    {product.proveedor}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="relative aspect-video bg-steel-800 rounded-xl overflow-hidden">
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.technicalName}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-steel-900/80 hover:bg-steel-800 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-steel-900/80 hover:bg-steel-800 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`
                          flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                          ${idx === selectedImageIndex ? 'border-primary' : 'border-steel-700 hover:border-steel-500'}
                        `}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category & Subcategory */}
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <Badge className="bg-primary/20 text-primary border-primary">
                  <Layers className="w-3 h-3 mr-1" />
                  {product.category}
                </Badge>
              )}
              {product.subcategory && (
                <Badge className="bg-secondary/20 text-secondary border-secondary">
                  {product.subcategory}
                </Badge>
              )}
            </div>

            {/* Compatible Models */}
            {product.compatible_models && (
              <div className="p-4 bg-steel-800/50 rounded-xl border border-steel-700">
                <h4 className="font-subtitle font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-secondary" />
                  Compatibilidad
                </h4>
                <p className="text-sm text-muted-foreground">{product.compatible_models}</p>
              </div>
            )}

            {/* Technical Attributes */}
            {product.attributes && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-subtitle font-semibold text-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    Atributos Tecnicos
                  </h4>
                  <div className="space-y-2 text-sm">
                    {product.attributes.material && (
                      <div className="flex justify-between py-2 border-b border-steel-700">
                        <span className="text-muted-foreground">Material</span>
                        <span className="text-foreground">{product.attributes.material}</span>
                      </div>
                    )}
                    {product.attributes.mechanicalFunction && (
                      <div className="flex justify-between py-2 border-b border-steel-700">
                        <span className="text-muted-foreground">Funcion</span>
                        <span className="text-foreground text-right max-w-[200px]">{product.attributes.mechanicalFunction}</span>
                      </div>
                    )}
                    {product.attributes.weight && (
                      <div className="flex justify-between py-2 border-b border-steel-700">
                        <span className="text-muted-foreground">Peso</span>
                        <span className="text-foreground">{product.attributes.weight}</span>
                      </div>
                    )}
                    {product.attributes.dimensions && (
                      <div className="flex justify-between py-2 border-b border-steel-700">
                        <span className="text-muted-foreground">Dimensiones</span>
                        <span className="text-foreground">{product.attributes.dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fitment */}
                {product.fitment && (
                  <div className="space-y-3">
                    <h4 className="font-subtitle font-semibold text-foreground flex items-center gap-2">
                      <Car className="w-4 h-4 text-secondary" />
                      Fitment
                    </h4>
                    <div className="space-y-2 text-sm">
                      {product.fitment.brands.length > 0 && (
                        <div className="py-2 border-b border-steel-700">
                          <span className="text-muted-foreground block mb-1">Marcas</span>
                          <div className="flex flex-wrap gap-1">
                            {product.fitment.brands.map((brand) => (
                              <Badge key={brand} variant="outline" className="text-xs">{brand}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.fitment.models.length > 0 && (
                        <div className="py-2 border-b border-steel-700">
                          <span className="text-muted-foreground block mb-1">Modelos</span>
                          <div className="flex flex-wrap gap-1">
                            {product.fitment.models.slice(0, 4).map((model) => (
                              <Badge key={model} variant="outline" className="text-xs">{model}</Badge>
                            ))}
                            {product.fitment.models.length > 4 && (
                              <Badge variant="outline" className="text-xs">+{product.fitment.models.length - 4} mas</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {product.fitment.years.length > 0 && (
                        <div className="py-2 border-b border-steel-700">
                          <span className="text-muted-foreground block mb-1">Anos</span>
                          <span className="text-foreground">
                            {product.fitment.years[0]} - {product.fitment.years[product.fitment.years.length - 1]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Descriptions */}
            <div className="space-y-4">
              {product.technicalDescription && (
                <div className="p-4 bg-steel-800/50 rounded-xl border border-steel-700">
                  <h4 className="font-subtitle font-semibold text-foreground flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Descripcion Tecnica SRM
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.technicalDescription}
                  </p>
                </div>
              )}

              {product.commercialDescription && (
                <div className="p-4 bg-steel-800/50 rounded-xl border border-steel-700">
                  <h4 className="font-subtitle font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-secondary" />
                    Descripcion Comercial
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.commercialDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Aliases */}
            {product.aliases && product.aliases.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-subtitle font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Alias / Nombres Alternativos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.aliases.map((alias) => (
                    <Badge key={alias} variant="secondary" className="bg-steel-700">{alias}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SRM360Viewer;
