import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { NewsTicker } from "@/components/catalog/NewsTicker";
import { AcademiaSection } from "@/components/catalog/AcademiaSection";
import { CATALOG_CATEGORIES } from "@/data/catalog-categories";
import { useState } from "react";
import { Factory, Ship, Truck, Warehouse, Wrench, Sparkles } from "lucide-react";

const quickFilterIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  fabricantes: Factory,
  importadores: Ship,
  distribuidores: Truck,
  almacenes: Warehouse,
  talleres: Wrench,
};

const Catalogo = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleToggle = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const filteredCategories = activeFilter 
    ? CATALOG_CATEGORIES.filter(c => c.id === activeFilter)
    : CATALOG_CATEGORIES;

  const totalClients = CATALOG_CATEGORIES.reduce((acc, cat) => acc + cat.clients.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />

      {/* Hero Header */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 industrial-grid opacity-20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-srm-blue/10 rounded-full blur-[100px]" />
        
        {/* Dynamic Lines */}
        <div className="absolute inset-0 dynamic-lines opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-subtitle font-semibold">
                <Sparkles className="w-4 h-4" />
                Catálogo Profesional
              </span>
              <span className="px-3 py-1 rounded-full bg-steel-700 text-steel-300 text-sm font-body">
                {totalClients} clientes activos
              </span>
            </div>
            
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Catálogo <span className="text-primary">SRM</span>
              <span className="block text-2xl md:text-3xl text-steel-400 font-subtitle font-semibold mt-2">
                Fichas y Terminología Técnica Profesional
              </span>
            </h1>
            
            <p className="font-body text-muted-foreground text-lg md:text-xl max-w-3xl leading-relaxed mb-8">
              Explora el ecosistema técnico más completo de la industria de motocicletas. 
              Fabricantes, importadores, distribuidores, almacenes y talleres conectados 
              por la <span className="text-primary font-semibold">Lógica de Inventarios 360°</span>.
            </p>

            {/* Bloque de poder - Neuromarketing */}
            <div className="bg-steel-800/60 border border-steel-700 rounded-xl p-6 backdrop-blur-sm">
              <p className="font-body text-foreground/90 text-base md:text-lg leading-relaxed">
                <span className="text-primary font-semibold">SRM</span> transforma catálogos en información confiable, 
                reduce errores, acelera ventas y crea un <span className="text-secondary font-semibold">lenguaje unificado</span> para 
                toda la cadena técnica de repuestos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* News Ticker */}
      <NewsTicker />

      {/* Quick Filters */}
      <section className="py-6 border-b border-steel-700 bg-steel-800/30 sticky top-20 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="font-subtitle text-sm text-steel-400 flex-shrink-0">Filtrar:</span>
            <button
              onClick={() => setActiveFilter(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-subtitle font-medium transition-all flex-shrink-0 ${
                activeFilter === null
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-steel-700 text-steel-300 hover:bg-steel-600"
              }`}
            >
              Todos
            </button>
            {CATALOG_CATEGORIES.map((category) => {
              const IconComponent = quickFilterIcons[category.id] || Factory;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(activeFilter === category.id ? null : category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-subtitle font-medium transition-all flex-shrink-0 ${
                    activeFilter === category.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-steel-700 text-steel-300 hover:bg-steel-600"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.title}
                  <span className="text-xs opacity-70">({category.clients.length})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
            {filteredCategories.map((category, index) => (
              <div
                key={category.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CategoryCard
                  category={category}
                  isExpanded={expandedCategory === category.id}
                  onToggle={() => handleToggle(category.id)}
                />
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "9+", label: "Clientes Activos", color: "primary" },
              { value: "360°", label: "Fichas Técnicas", color: "srm-blue" },
              { value: "5", label: "Categorías", color: "green-500" },
              { value: "∞", label: "Productos Integrados", color: "purple-500" },
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-steel-800/50 rounded-xl border border-steel-700 p-6 text-center hover:border-primary/30 transition-colors"
              >
                <div className={`font-display font-extrabold text-3xl md:text-4xl text-${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="font-body text-steel-400 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academia Section */}
      <AcademiaSection />

      <FooterSRM />
    </div>
  );
};

export default Catalogo;
