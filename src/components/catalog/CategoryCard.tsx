import { Factory, Ship, Truck, Warehouse, Wrench, ChevronRight, ExternalLink, ArrowRight } from "lucide-react";
import { CatalogCategory } from "@/data/catalog-categories";
import { SRMButton } from "@/components/SRMButton";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Factory,
  Ship,
  Truck,
  Warehouse,
  Wrench,
};

interface CategoryCardProps {
  category: CatalogCategory;
  isExpanded: boolean;
  onToggle: () => void;
}

export function CategoryCard({ category, isExpanded, onToggle }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon] || Factory;
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);

  return (
    <div className="group">
      {/* Main Card */}
      <div 
        onClick={onToggle}
        className={`relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer ${
          isExpanded 
            ? "border-primary bg-gradient-to-br from-primary/10 to-transparent" 
            : "border-steel-700 hover:border-primary/50 bg-steel-800/50 hover:bg-steel-800"
        }`}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-50 transition-opacity duration-500 ${isExpanded ? "opacity-70" : "group-hover:opacity-60"}`} />
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg transition-transform duration-300 ${isExpanded ? "scale-110" : "group-hover:scale-105"}`}>
              <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-subtitle font-semibold uppercase tracking-wider">
                  {category.title}
                </span>
                <span className="text-steel-400 text-sm">
                  {category.clients.length} cliente{category.clients.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <h3 className="font-display font-bold text-xl md:text-2xl text-foreground mb-2 leading-tight">
                {category.emotionalTitle}
              </h3>
              
              <p className="font-body text-muted-foreground text-sm md:text-base line-clamp-2">
                {category.subtitle}
              </p>
            </div>
            
            {/* Expand Arrow */}
            <ChevronRight className={`w-6 h-6 text-steel-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? "rotate-90 text-primary" : "group-hover:text-primary"}`} />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
        <div className="bg-steel-800/30 rounded-2xl border border-steel-700 p-6 md:p-8 space-y-8">
          {/* Narrative */}
          <div className="prose prose-invert max-w-none">
            <p className="font-body text-steel-300 text-base md:text-lg leading-relaxed italic border-l-4 border-primary pl-4">
              "{category.narrative}"
            </p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-subtitle font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-1 bg-primary rounded-full" />
              Cómo SRM potencia a los {category.title.toLowerCase()}
            </h4>
            <ul className="grid md:grid-cols-2 gap-3">
              {category.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-steel-700/30 hover:bg-steel-700/50 transition-colors">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-body text-steel-200 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* News Board */}
          <div className="bg-steel-900/50 rounded-xl p-4 border border-steel-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-subtitle font-semibold text-sm text-primary uppercase tracking-wider">
                📰 Tablero de Noticias
              </h4>
              <div className="flex gap-1">
                {category.newsBoard.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveNewsIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeNewsIndex ? "bg-primary" : "bg-steel-600 hover:bg-steel-500"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden h-12">
              {category.newsBoard.map((news, index) => (
                <p 
                  key={index}
                  className={`absolute inset-0 font-body text-steel-300 transition-all duration-500 flex items-center ${
                    index === activeNewsIndex 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <span className="text-primary mr-2">→</span> {news}
                </p>
              ))}
            </div>
          </div>

          {/* Clients Grid */}
          <div>
            <h4 className="font-subtitle font-semibold text-lg text-foreground mb-4">
              Clientes {category.title} en SRM
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.clients.map((client) => (
                <div 
                  key={client.id}
                  className="bg-steel-700/40 rounded-xl p-4 border border-steel-600 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                      <img 
                        src={client.logo} 
                        alt={client.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/srm-icons/srm-icon-256.png";
                        }}
                      />
                    </div>
                    <div>
                      <h5 className="font-subtitle font-semibold text-foreground">{client.name}</h5>
                      {client.role && (
                        <p className="text-xs text-steel-400">{client.role}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SRMButton 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = client.landing;
                      }}
                    >
                      Landing
                    </SRMButton>
                    <SRMButton 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(client.shopify, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Tienda
                    </SRMButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
