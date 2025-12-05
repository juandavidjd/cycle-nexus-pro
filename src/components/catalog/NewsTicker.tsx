import { useEffect, useState } from "react";
import { Newspaper, TrendingUp, Zap, GraduationCap, Factory, Ship, Truck, Warehouse, Wrench } from "lucide-react";

interface NewsItem {
  icon: string;
  text: string;
  category?: string;
}

const NEWS_ITEMS: NewsItem[] = [
  // Academia SRM
  { icon: "academia", text: "Academia SRM abrirá sus primeros cursos certificados 2025: Fundamentos + Terminología", category: "academia" },
  { icon: "academia", text: "Nuevo módulo: Gestión de inventarios con lógica 360° para distribuidores y almacenes", category: "academia" },
  { icon: "academia", text: "Se habilita programa de certificación para talleres con diagnóstico asistido SRM", category: "academia" },
  { icon: "academia", text: "SRM prepara curso especializado para importadores: Riesgo técnico y compatibilidad", category: "academia" },
  { icon: "academia", text: "Currículum SRM ya supera 40 lecciones estructuradas, listas para profesionales del sector", category: "academia" },
  { icon: "academia", text: "Pronto: ruta de aprendizaje por roles – Mecánico, Vendedor, Jefe de Inventarios, Importador", category: "academia" },
  { icon: "academia", text: "Publicación SRM: Diccionario técnico de la industria disponible como recurso gratuito", category: "academia" },
  { icon: "academia", text: "Lanzamiento de SRM Podcast – Historias reales de la industria de motocicletas", category: "academia" },
  // Fabricantes
  { icon: "factory", text: "Japan alcanza 10.000+ productos estandarizados en SRM, fortaleciendo la trazabilidad nacional", category: "fabricantes" },
  { icon: "factory", text: "Fabricantes conectados a SRM reportan 42% menos devoluciones gracias a fichas verificadas", category: "fabricantes" },
  { icon: "factory", text: "Estandarización SRM reduce 70% de errores de identificación en piezas OEM nacionales", category: "fabricantes" },
  // Importadores
  { icon: "ship", text: "Importadores SRM reportan 40% más eficiencia operativa tras homologación técnica", category: "importadores" },
  { icon: "ship", text: "Yokomar integra catálogo con terminología SRM y supera 15.000 fichas técnicas", category: "importadores" },
  { icon: "ship", text: "Mapeo de compatibilidades cruzadas reduce hasta 60% devoluciones en importadores", category: "importadores" },
  // Distribuidores
  { icon: "truck", text: "Distribuidores SRM ya conectan más de 8 ciudades principales con disponibilidad confirmada", category: "distribuidores" },
  { icon: "truck", text: "Inventario unificado con terminología SRM mejora tiempos de despacho en 37%", category: "distribuidores" },
  // Almacenes
  { icon: "warehouse", text: "Almacenes SRM reducen 55% errores de mostrador con búsqueda inteligente", category: "almacenes" },
  { icon: "warehouse", text: "Almacenes certificados reportan incremento de 28% en ticket promedio gracias a fichas técnicas", category: "almacenes" },
  // Talleres
  { icon: "wrench", text: "Talleres SRM reducen hasta 80% el tiempo de identificación, gracias al fitment automatizado", category: "talleres" },
  { icon: "wrench", text: "Mecánicos con SRM reportan 3X más confianza al recomendar repuestos al cliente final", category: "talleres" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp,
  zap: Zap,
  news: Newspaper,
  academia: GraduationCap,
  factory: Factory,
  ship: Ship,
  truck: Truck,
  warehouse: Warehouse,
  wrench: Wrench,
};

const categoryColors: Record<string, string> = {
  academia: "text-blue-400",
  fabricantes: "text-red-400",
  importadores: "text-cyan-400",
  distribuidores: "text-green-400",
  almacenes: "text-purple-400",
  talleres: "text-amber-400",
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
          const iconColor = item.category ? categoryColors[item.category] : "text-primary";
          return (
            <div key={index} className="flex items-center gap-3 text-steel-300">
              <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
              <span className="font-body text-sm">{item.text}</span>
              <span className="text-steel-600">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
