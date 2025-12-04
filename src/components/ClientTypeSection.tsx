import { Client, ClientType, CLIENT_TYPE_LABELS } from "@/types/client";
import { CatalogGrid } from "./CatalogGrid";
import { Factory, Ship, Truck, Warehouse, Wrench } from "lucide-react";

interface ClientTypeSectionProps {
  type: ClientType;
  clients: Client[];
}

const typeIcons: Record<ClientType, React.ElementType> = {
  Fabricante: Factory,
  Importador: Ship,
  Distribuidor: Truck,
  Almacén: Warehouse,
  Taller: Wrench,
};

export function ClientTypeSection({ type, clients }: ClientTypeSectionProps) {
  if (clients.length === 0) return null;

  const Icon = typeIcons[type];
  const { title, description } = CLIENT_TYPE_LABELS[type];

  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {description}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-gradient mb-8" />

      {/* Grid */}
      <CatalogGrid clients={clients} showType={false} />
    </section>
  );
}
