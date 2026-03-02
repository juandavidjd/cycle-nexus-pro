// src/components/habitat/ProductGrid.tsx
// Grid de productos reutilizable — SRM y Habitat usan el mismo.
// Recibe productos del API (ODIProduct[]) y los renderiza como cards.

import { ExternalLink } from 'lucide-react';
import { formatPriceCOP, PLACEHOLDER_IMG, type ODIProduct } from '@/lib/odiApi';

interface ProductGridProps {
  productos: ODIProduct[];
  maxItems?: number;
}

export function ProductGrid({ productos, maxItems = 5 }: ProductGridProps) {
  if (!productos || productos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {productos.slice(0, maxItems).map((product) => (
        <div
          key={product.sku}
          className="flex gap-3 p-3 rounded-xl border transition-colors"
          style={{
            background: "rgba(11,22,37,0.7)",
            borderColor: "rgba(74,101,133,0.25)",
          }}
        >
          {/* Image */}
          <img
            src={product.image || PLACEHOLDER_IMG}
            alt={product.title}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            style={{ background: "#0b1625" }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#e8ecf1" }}>
              {product.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6b8aad" }}>
              {product.from || product.vendor}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold" style={{ color: "#2ef08a" }}>
                {formatPriceCOP(String(product.price))}
              </span>
              <span
                className="text-[10px] px-1.5 py-0 rounded border"
                style={{ color: "#6b8aad", borderColor: "rgba(74,101,133,0.3)" }}
              >
                {product.store}
              </span>
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
              <button
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors"
                style={{
                  color: "#8ab4d8",
                  borderColor: "rgba(74,101,133,0.3)",
                  background: "rgba(11,22,37,0.5)",
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Ver
              </button>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
