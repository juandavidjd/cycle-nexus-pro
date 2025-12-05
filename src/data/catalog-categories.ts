export interface CategoryClient {
  id: string;
  name: string;
  role?: string;
  logo: string;
  shopify: string;
  landing: string;
}

export interface CatalogCategory {
  id: string;
  title: string;
  emotionalTitle: string;
  subtitle: string;
  icon: string;
  narrative: string;
  benefits: string[];
  newsBoard: string[];
  clients: CategoryClient[];
  gradient: string;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "fabricantes",
    title: "Fabricantes",
    emotionalTitle: "Fabricantes que mueven la industria con ingeniería real",
    subtitle: "Marcas que diseñan y producen repuestos originales con estándares de calidad internacional",
    icon: "Factory",
    narrative: "Detrás de cada pieza que mantiene una moto en movimiento, hay un fabricante que entiende la responsabilidad de crear productos que salvan vidas. Los fabricantes SRM no solo producen repuestos: diseñan confianza, fabrican seguridad y entregan tranquilidad. Cuando eliges un fabricante certificado SRM, estás eligiendo la ingeniería que respeta tu tiempo, tu dinero y tu camino.",
    benefits: [
      "Estandarización técnica de catálogos completos",
      "Fichas 360° con especificaciones verificadas",
      "Integración directa con distribuidores y talleres",
      "Terminología unificada para toda la cadena",
      "Visibilidad en el ecosistema SRM nacional"
    ],
    newsBoard: [
      "Japan lanza nueva línea de frenos cerámicos 2024",
      "Leo expande producción de amortiguadores OEM",
      "Certificación ISO 9001 para fabricantes SRM",
      "Nuevos estándares de calidad en suspensiones"
    ],
    clients: [
      { id: "japan", name: "Japan", logo: "/logos/japan.png", shopify: "https://repuestosjapan.myshopify.com", landing: "/japan" },
      { id: "leo", name: "Leo", logo: "/logos/leo.png", shopify: "https://leo-motos.myshopify.com", landing: "/leo" }
    ],
    gradient: "from-red-600/20 to-orange-600/20"
  },
  {
    id: "importadores",
    title: "Importadores",
    emotionalTitle: "Importadores que mantienen vivo el flujo técnico del país",
    subtitle: "Empresas que conectan la tecnología internacional con el mercado colombiano",
    icon: "Ship",
    narrative: "Cada contenedor que cruza el océano trae más que productos: trae soluciones, innovación y oportunidades. Los importadores SRM son el puente invisible que conecta la ingeniería mundial con el taller de tu barrio. Sin ellos, la industria se detendría. Con SRM, su catálogo se vuelve comprensible, estandarizado y listo para vender. Porque importar no es solo traer: es traducir el mundo técnico para Colombia.",
    benefits: [
      "Normalización de catálogos internacionales",
      "Traducción técnica automática",
      "Homologación con nomenclatura colombiana",
      "Mapeo de compatibilidades cruzadas",
      "Conexión directa con red de distribuidores"
    ],
    newsBoard: [
      "Bara amplía portafolio con línea taiwanesa",
      "DFG incorpora transmisiones de alta gama",
      "Duna recibe certificación de importador premium",
      "Yokomar expande cobertura a 12 departamentos",
      "Vaisand introduce línea de iluminación LED"
    ],
    clients: [
      { id: "bara", name: "Bara", logo: "/logos/bara.png", shopify: "https://bara-importaciones.myshopify.com", landing: "/bara" },
      { id: "dfg", name: "DFG", logo: "/logos/dfg.png", shopify: "https://dfg-parts.myshopify.com", landing: "/dfg" },
      { id: "duna", name: "Duna", logo: "/logos/duna.png", shopify: "https://duna.myshopify.com", landing: "/duna" },
      { id: "yokomar", name: "Yokomar", logo: "/logos/yokomar.png", shopify: "https://yokomar-colombia.myshopify.com", landing: "/yokomar" },
      { id: "vaisand", name: "Vaisand", logo: "/logos/vaisand.png", shopify: "https://vaisand.myshopify.com", landing: "/vaisand" }
    ],
    gradient: "from-blue-600/20 to-cyan-600/20"
  },
  {
    id: "distribuidores",
    title: "Distribuidores",
    emotionalTitle: "Distribuidores que conectan la industria con todo el país",
    subtitle: "La red logística que garantiza disponibilidad donde más se necesita",
    icon: "Truck",
    narrative: "Mientras tú duermes, los distribuidores SRM están moviendo el país. Son los arterias de la industria, llevando cada pieza al lugar exacto donde un mecánico la necesita. Un distribuidor eficiente no solo entrega productos: entrega tiempo, resuelve urgencias y mantiene negocios funcionando. Con SRM, su inventario habla el mismo idioma técnico que fabricantes y talleres.",
    benefits: [
      "Inventario unificado con terminología SRM",
      "Rotación optimizada por demanda regional",
      "Conexión B2B con almacenes certificados",
      "Fichas técnicas para fuerza de ventas",
      "Reportes de tendencias por zona"
    ],
    newsBoard: [
      "Kaiqi Parts amplía red de distribución nacional",
      "Store alcanza cobertura en 8 ciudades principales",
      "Nueva alianza logística reduce tiempos de entrega",
      "Sistema de pedidos B2B integrado con SRM"
    ],
    clients: [
      { id: "kaiqi", name: "Kaiqi Parts", role: "Distribuidor Nacional", logo: "/logos/kaiqi.png", shopify: "https://kaiqi.myshopify.com", landing: "/kaiqi" },
      { id: "store", name: "Store", logo: "/logos/store.png", shopify: "https://store-motos.myshopify.com", landing: "/store" }
    ],
    gradient: "from-green-600/20 to-emerald-600/20"
  },
  {
    id: "almacenes",
    title: "Almacenes",
    emotionalTitle: "Almacenes que impulsan al mecánico con información confiable",
    subtitle: "Puntos de venta especializados con conocimiento técnico real",
    icon: "Warehouse",
    narrative: "El almacén de repuestos es donde la teoría se encuentra con la realidad. Es el lugar donde un mecánico confía su reputación y un motociclista su seguridad. Los almacenes SRM no solo venden piezas: asesoran, recomiendan y garantizan. Porque vender sin conocimiento es arriesgar vidas. Con SRM, cada vendedor tiene acceso a la ficha técnica completa de cada producto.",
    benefits: [
      "Catálogo digital con búsqueda inteligente",
      "Fichas técnicas para mostrador",
      "Compatibilidades verificadas por SRM",
      "Historial de rotación y tendencias",
      "Conexión directa con proveedores certificados"
    ],
    newsBoard: [
      "Casa China Motos inaugura nuevo punto de venta",
      "Store implementa sistema de consulta SRM en mostrador",
      "Capacitación técnica para vendedores de almacén",
      "Nuevo sistema de garantías con trazabilidad SRM"
    ],
    clients: [
      { id: "kaiqi-almacen", name: "Kaiqi Parts", role: "Casa China Motos", logo: "/logos/kaiqi.png", shopify: "https://kaiqi.myshopify.com", landing: "/kaiqi" },
      { id: "store-almacen", name: "Store", logo: "/logos/store.png", shopify: "https://store-motos.myshopify.com", landing: "/store" }
    ],
    gradient: "from-purple-600/20 to-pink-600/20"
  },
  {
    id: "talleres",
    title: "Talleres",
    emotionalTitle: "Talleres que convierten problemas en movimiento",
    subtitle: "Los expertos que mantienen a Colombia rodando con confianza",
    icon: "Wrench",
    narrative: "Un taller no es solo un lugar de reparación: es donde se restaura la confianza, se recupera la movilidad y se protegen familias. El mecánico SRM no adivina: diagnostica con información técnica real. No improvisa: instala con especificaciones verificadas. El taller conectado a SRM es un taller que respeta su oficio y honra la confianza de sus clientes.",
    benefits: [
      "Diagnóstico asistido por fichas técnicas",
      "Búsqueda de repuestos por síntoma o aplicación",
      "Conexión directa con proveedores cercanos",
      "Historial técnico de reparaciones",
      "Certificación SRM para talleres de confianza"
    ],
    newsBoard: [
      "Taller Casa China Motos recibe certificación SRM",
      "Nuevo programa de capacitación para mecánicos",
      "Herramienta de diagnóstico SRM disponible",
      "Red de talleres certificados supera los 50 puntos"
    ],
    clients: [
      { id: "kaiqi-taller", name: "Kaiqi Parts", role: "Taller Casa China Motos", logo: "/logos/kaiqi.png", shopify: "https://kaiqi.myshopify.com", landing: "/kaiqi" }
    ],
    gradient: "from-amber-600/20 to-yellow-600/20"
  }
];

export const ACADEMIA_SECTIONS = [
  { id: "cursos", title: "Cursos Técnicos", description: "Formación especializada para profesionales", icon: "GraduationCap" },
  { id: "fundamentos", title: "Fundamentos SRM", description: "Bases del sistema de estandarización", icon: "BookOpen" },
  { id: "terminologia", title: "Terminología Técnica", description: "Diccionario unificado de la industria", icon: "FileText" },
  { id: "lecturas", title: "Lecturas Rápidas", description: "Artículos y guías prácticas", icon: "Newspaper" },
  { id: "certificaciones", title: "Certificaciones", description: "Acreditaciones oficiales SRM", icon: "Award" }
];
