import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { CatalogGrid } from "@/components/CatalogGrid";
import { Client } from "@/types/client";
import clientsData from "@/data/clients.json";
import { Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const Catalogo = () => {
  const clients = clientsData as Client[];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(clients.map(c => c.type))];
    return types;
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || client.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, filterType]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />

      {/* Header */}
      <section className="pt-32 pb-12 relative overflow-hidden dynamic-lines">
        <div className="absolute inset-0 industrial-grid opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-subtitle font-semibold mb-4">
              Catálogo Completo
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-foreground mb-4">
              Catálogo <span className="text-primary">SRM</span>
            </h1>
            <p className="font-body text-muted-foreground text-lg">
              Explora todos los clientes del ecosistema técnico. Fichas y Terminología Técnica con tiendas oficiales.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-y border-steel-700 bg-steel-800/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-steel-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-subtitle font-medium transition-colors ${
                  filterType === "all"
                    ? "bg-primary text-primary-foreground glow-red"
                    : "bg-steel-700 text-steel-300 hover:bg-steel-600"
                }`}
              >
                Todos
              </button>
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-subtitle font-medium transition-colors ${
                    filterType === type
                      ? "bg-primary text-primary-foreground glow-red"
                      : "bg-steel-700 text-steel-300 hover:bg-steel-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          {filteredClients.length > 0 ? (
            <>
              <p className="font-body text-muted-foreground mb-6">
                Mostrando {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
              </p>
              <CatalogGrid clients={filteredClients} />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="font-body text-muted-foreground text-lg">
                No se encontraron clientes con los filtros seleccionados.
              </p>
            </div>
          )}
        </div>
      </section>

      <FooterSRM />
    </div>
  );
};

export default Catalogo;
