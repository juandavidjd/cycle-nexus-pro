import { Client } from "@/types/client";
import { SRMButton } from "./SRMButton";
import { Store, ArrowRight } from "lucide-react";

interface BrandCardProps {
  client: Client;
  showType?: boolean;
}

export function BrandCard({ client, showType = true }: BrandCardProps) {
  return (
    <article
      className="card-industrial rounded-xl overflow-hidden hover-lift group"
      style={{
        borderTop: `3px solid ${client.palette.primary}`,
      }}
    >
      {/* Header with Brand Color Accent */}
      <div
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${client.palette.primary}, ${client.palette.accent})`,
        }}
      />

      <div className="p-6">
        {/* Logo & Info */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-display font-bold text-white shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: client.palette.primary }}
          >
            {client.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-xl text-foreground truncate">
              {client.name}
            </h3>
            {showType && (
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-medium mt-1"
                style={{
                  backgroundColor: `${client.palette.primary}20`,
                  color: client.palette.primary,
                }}
              >
                {client.type}
              </span>
            )}
          </div>
        </div>

        {/* Description Placeholder */}
        <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
          Ficha Técnica SRM + Atributos + Fitment + Conocimiento Unificado del ecosistema.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <SRMButton
            to={`/${client.id}`}
            variant="brand"
            size="sm"
            brandColor={client.palette.primary}
            className="w-full"
          >
            <span>Landing Técnica SRM</span>
            <ArrowRight className="w-4 h-4" />
          </SRMButton>

          <SRMButton
            href={client.shopify}
            variant="outline"
            size="sm"
            className="w-full"
            external
          >
            <Store className="w-4 h-4" />
            <span>Tienda Shopify</span>
          </SRMButton>
        </div>
      </div>
    </article>
  );
}
