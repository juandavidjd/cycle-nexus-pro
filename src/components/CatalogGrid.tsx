import { Client } from "@/types/client";
import { BrandCard } from "./BrandCard";

interface CatalogGridProps {
  clients: Client[];
  showType?: boolean;
}

export function CatalogGrid({ clients, showType = true }: CatalogGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {clients.map((client, index) => (
        <div
          key={client.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <BrandCard client={client} showType={showType} />
        </div>
      ))}
    </div>
  );
}
