import { useEffect, useState } from "react";
import { Newspaper, TrendingUp, Zap } from "lucide-react";

const NEWS_ITEMS = [
  { icon: "trending", text: "Japan alcanza 10,000+ productos estandarizados en SRM" },
  { icon: "zap", text: "Nueva integración Shopify disponible para todos los clientes" },
  { icon: "news", text: "Kaiqi Parts expande operación a 5 ciudades adicionales" },
  { icon: "trending", text: "Sistema de fichas 360° supera 50,000 referencias técnicas" },
  { icon: "zap", text: "Yokomar implementa catálogo digital con terminología SRM" },
  { icon: "news", text: "Certificación SRM ahora disponible para talleres independientes" },
  { icon: "trending", text: "Bara reporta 40% más eficiencia con estandarización SRM" },
  { icon: "zap", text: "Academia SRM lanza nuevos cursos de diagnóstico técnico" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp,
  zap: Zap,
  news: Newspaper,
};

export function NewsTicker() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Duplicate items for seamless loop
  const duplicatedItems = [...NEWS_ITEMS, ...NEWS_ITEMS];

  return (
    <div className="relative overflow-hidden bg-steel-900/80 border-y border-steel-700 py-3">
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-steel-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-steel-900 to-transparent z-10" />
      
      {/* Ticker content */}
      <div 
        className="flex items-center gap-12 whitespace-nowrap"
        style={{
          transform: `translateX(-${offset % (NEWS_ITEMS.length * 400)}px)`,
          transition: "none"
        }}
      >
        {duplicatedItems.map((item, index) => {
          const IconComponent = iconMap[item.icon] || Newspaper;
          return (
            <div key={index} className="flex items-center gap-3 text-steel-300">
              <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-body text-sm">{item.text}</span>
              <span className="text-steel-600">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
