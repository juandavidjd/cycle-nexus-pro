import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { ClientTypeSection } from "@/components/ClientTypeSection";
import { Client, CLIENT_TYPES } from "@/types/client";
import clientsData from "@/data/clients.json";
import { useMemo } from "react";

const Clientes = () => {
  const clients = clientsData as Client[];

  const groupedClients = useMemo(() => {
    const groups: Record<string, Client[]> = {};
    CLIENT_TYPES.forEach(type => {
      groups[type] = clients.filter(c => c.type === type);
    });
    return groups;
  }, [clients]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />

      {/* Header */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 industrial-grid opacity-30" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Red de Clientes
            </span>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Clientes SRM
            </h1>
            <p className="text-muted-foreground text-lg">
              Clasificación por tipo: fabricantes, importadores, distribuidores, almacenes y talleres conectados al ecosistema.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="divider-gradient" />
      </div>

      {/* Client Groups */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          {CLIENT_TYPES.map(type => (
            <ClientTypeSection
              key={type}
              type={type}
              clients={groupedClients[type] || []}
            />
          ))}
        </div>
      </section>

      <FooterSRM />
    </div>
  );
};

export default Clientes;
