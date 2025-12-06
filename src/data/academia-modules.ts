export interface AcademiaModule {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  level: number;
  objectives: string[];
  topics: string[];
  exercises: string[];
  duration: string;
  icon: string;
}

export interface AcademiaLevel {
  id: number;
  name: string;
  title: string;
  description: string;
  color: string;
  modules: number[];
}

export const ACADEMIA_LEVELS: AcademiaLevel[] = [
  {
    id: 1,
    name: "Nivel 1",
    title: "Fundamentos SRM",
    description: "Terminología básica, sistemas de la moto, lectura de fichas. La base para entender el ecosistema técnico.",
    color: "from-blue-500 to-blue-600",
    modules: [1, 2, 3]
  },
  {
    id: 2,
    name: "Nivel 2",
    title: "Técnica SRM",
    description: "Fitment, compatibilidad, lectura de catálogos, nomenclatura profesional.",
    color: "from-green-500 to-green-600",
    modules: [4, 5, 6, 7]
  },
  {
    id: 3,
    name: "Nivel 3",
    title: "Ventas e Inventarios 360°",
    description: "Gestión de inventarios, psicología de ventas, atención técnica profesional.",
    color: "from-yellow-500 to-yellow-600",
    modules: [8, 9, 10, 11]
  },
  {
    id: 4,
    name: "Nivel 4",
    title: "Especialización por Rol",
    description: "Módulos diferenciados para talleres, almacenes, importadores, distribuidores y fabricantes.",
    color: "from-orange-500 to-orange-600",
    modules: [12, 13, 14, 15, 16, 17]
  },
  {
    id: 5,
    name: "Nivel 5",
    title: "Certificación SRM PRO",
    description: "Evaluación formal + proyecto práctico supervisado. Conviértete en profesional certificado.",
    color: "from-primary to-red-600",
    modules: [18, 19, 20]
  }
];

export const ACADEMIA_MODULES: AcademiaModule[] = [
  {
    id: 1,
    title: "Fundamentos de la Motocicleta",
    shortTitle: "Fundamentos Moto",
    description: "Sistemas: motor, frenos, dirección, suspensión, eléctrico. Cómo se conecta cada sistema con un repuesto.",
    level: 1,
    objectives: [
      "Identificar los 5 sistemas principales de una motocicleta",
      "Comprender cómo cada sistema se relaciona con los repuestos",
      "Evitar errores comunes al identificar piezas"
    ],
    topics: [
      "Sistema de motor",
      "Sistema de frenos",
      "Sistema de dirección",
      "Sistema de suspensión",
      "Sistema eléctrico"
    ],
    exercises: [
      "Identificar piezas en imágenes",
      "Relacionar sistema con repuesto",
      "Quiz de componentes"
    ],
    duration: "2 horas",
    icon: "Wrench"
  },
  {
    id: 2,
    title: "Terminología Técnica SRM",
    shortTitle: "Terminología SRM",
    description: "Diccionario técnico SRM. Diferencias entre términos empíricos y OEM. Cómo SRM estandariza.",
    level: 1,
    objectives: [
      "Dominar el vocabulario técnico oficial SRM",
      "Distinguir entre términos empíricos y OEM",
      "Aplicar la estandarización SRM en comunicación"
    ],
    topics: [
      "Diccionario técnico SRM",
      "Términos empíricos vs OEM",
      "Proceso de estandarización",
      "Nomenclatura oficial"
    ],
    exercises: [
      "Normalizar 10 descripciones reales",
      "Convertir términos empíricos a SRM",
      "Examen de vocabulario"
    ],
    duration: "1.5 horas",
    icon: "BookOpen"
  },
  {
    id: 3,
    title: "Nomenclatura Profesional de Repuestos",
    shortTitle: "Nomenclatura",
    description: "Nombre técnico, alias comerciales, variantes. Estructura del nombre SRM.",
    level: 1,
    objectives: [
      "Entender la estructura de nombres SRM",
      "Identificar alias comerciales y variantes",
      "Aplicar nomenclatura profesional en inventarios"
    ],
    topics: [
      "Estructura del nombre técnico",
      "Alias comerciales comunes",
      "Variantes de producto",
      "Reglas de nomenclatura SRM"
    ],
    exercises: [
      "Convertir 10 alias empíricos a terminología SRM",
      "Crear nombres técnicos para productos",
      "Validar nomenclatura existente"
    ],
    duration: "1.5 horas",
    icon: "Tag"
  },
  {
    id: 4,
    title: "Fitment y Compatibilidad 360°",
    shortTitle: "Fitment 360°",
    description: "Qué significa 'aplicación por modelo'. Fitment tipo OEM. Cómo SRM interpreta compatibilidad.",
    level: 2,
    objectives: [
      "Comprender el concepto de fitment OEM",
      "Interpretar tablas de compatibilidad",
      "Construir fitment para productos nuevos"
    ],
    topics: [
      "Aplicación por modelo",
      "Fitment tipo OEM",
      "Interpretación de compatibilidad SRM",
      "Matrices de aplicación"
    ],
    exercises: [
      "Construir compatibilidad para 5 referencias",
      "Validar fitment existente",
      "Crear matriz de aplicación"
    ],
    duration: "2 horas",
    icon: "Settings"
  },
  {
    id: 5,
    title: "Lectura de Fichas Técnicas SRM",
    shortTitle: "Fichas Técnicas",
    description: "Cómo leer atributos, interpretar materiales, fotos, variantes, dimensiones y aplicaciones.",
    level: 2,
    objectives: [
      "Leer e interpretar fichas técnicas SRM",
      "Comprender atributos y especificaciones",
      "Usar fichas para asesoría técnica"
    ],
    topics: [
      "Atributos técnicos",
      "Materiales y especificaciones",
      "Fotografía de producto",
      "Dimensiones y variantes",
      "Aplicaciones compatibles"
    ],
    exercises: [
      "Leer 5 fichas SRM completas",
      "Extraer información para venta",
      "Comparar fichas de productos similares"
    ],
    duration: "2 horas",
    icon: "FileText"
  },
  {
    id: 6,
    title: "Catálogos Técnicos",
    shortTitle: "Catálogos",
    description: "Tipos de catálogos (OEM, Aftermarket, Importación, Ensamble). Cómo SRM los estandariza.",
    level: 2,
    objectives: [
      "Distinguir tipos de catálogos técnicos",
      "Entender el proceso de estandarización SRM",
      "Limpiar y organizar catálogos desordenados"
    ],
    topics: [
      "Catálogos OEM",
      "Catálogos Aftermarket",
      "Catálogos de importación",
      "Catálogos de ensamble",
      "Estandarización SRM"
    ],
    exercises: [
      "Clasificar 10 catálogos por tipo",
      "Limpiar un catálogo desordenado",
      "Identificar errores comunes"
    ],
    duration: "2.5 horas",
    icon: "Folder"
  },
  {
    id: 7,
    title: "Inventarios 360°",
    shortTitle: "Inventarios 360°",
    description: "Qué es la Lógica 360°. Entradas, salidas, rotación, riesgo. Cómo SRM Intelligent organiza inventarios.",
    level: 2,
    objectives: [
      "Dominar la Lógica de Inventarios 360°",
      "Gestionar entradas, salidas y rotación",
      "Usar SRM Intelligent para organización"
    ],
    topics: [
      "Lógica de Inventarios 360°",
      "Gestión de entradas y salidas",
      "Análisis de rotación",
      "Gestión de riesgo",
      "SRM Intelligent para inventarios"
    ],
    exercises: [
      "Detectar duplicados reales en inventario",
      "Calcular rotación de productos",
      "Simular gestión con SRM Intelligent"
    ],
    duration: "3 horas",
    icon: "Package"
  },
  {
    id: 8,
    title: "Psicología de Ventas Técnicas",
    shortTitle: "Psicología Ventas",
    description: "Sesgos cognitivos aplicados. PNL para asesoría técnica. Cómo transmitir seguridad.",
    level: 3,
    objectives: [
      "Aplicar principios de psicología en ventas",
      "Usar PNL para comunicación efectiva",
      "Transmitir confianza y seguridad técnica"
    ],
    topics: [
      "Sesgos cognitivos en ventas",
      "PNL para asesoría técnica",
      "Comunicación de seguridad",
      "Manejo de objeciones",
      "Cierre técnico de ventas"
    ],
    exercises: [
      "Ejercicios de comunicación técnica",
      "Role play de objeciones",
      "Práctica de cierre de ventas"
    ],
    duration: "2.5 horas",
    icon: "Brain"
  },
  {
    id: 9,
    title: "Atención al Cliente desde la Técnica",
    shortTitle: "Atención Técnica",
    description: "Cómo conectar ingeniería + comercial. Cómo explicar una pieza a un usuario no técnico.",
    level: 3,
    objectives: [
      "Conectar conocimiento técnico con atención comercial",
      "Explicar productos a usuarios no técnicos",
      "Mejorar la experiencia del cliente"
    ],
    topics: [
      "Conexión ingeniería-comercial",
      "Comunicación con usuarios no técnicos",
      "Experiencia del cliente",
      "Resolución de dudas técnicas"
    ],
    exercises: [
      "Role plays para venta técnica",
      "Simulación de atención al cliente",
      "Práctica de explicaciones simples"
    ],
    duration: "2 horas",
    icon: "Users"
  },
  {
    id: 10,
    title: "Talleres y Diagnóstico",
    shortTitle: "Diagnóstico",
    description: "Cómo diagnosticar fallas comunes. Cómo usar SRM para diagnóstico técnico.",
    level: 3,
    objectives: [
      "Diagnosticar fallas comunes en motocicletas",
      "Usar el catálogo SRM para diagnóstico",
      "Sugerir piezas correctas según síntomas"
    ],
    topics: [
      "Diagnóstico de fallas comunes",
      "SRM como herramienta de diagnóstico",
      "Relación síntoma-pieza",
      "Proceso de diagnóstico sistemático"
    ],
    exercises: [
      "Identificar fallo → pieza sugerida",
      "Crear árbol de diagnóstico",
      "Simular diagnóstico completo"
    ],
    duration: "3 horas",
    icon: "Search"
  },
  {
    id: 11,
    title: "Gestión de Bodega e Inventarios",
    shortTitle: "Gestión Bodega",
    description: "Codificación, señalización, control de referencias. Ordenamiento práctico profesional.",
    level: 3,
    objectives: [
      "Implementar sistemas de codificación efectivos",
      "Organizar bodegas de forma profesional",
      "Controlar referencias de manera eficiente"
    ],
    topics: [
      "Sistemas de codificación",
      "Señalización de bodega",
      "Control de referencias",
      "Ordenamiento por rotación",
      "Buenas prácticas de almacenamiento"
    ],
    exercises: [
      "Diseñar sistema de codificación",
      "Crear plan de señalización",
      "Ordenamiento práctico simulado"
    ],
    duration: "2.5 horas",
    icon: "Warehouse"
  },
  {
    id: 12,
    title: "Importación con Riesgo Técnico Controlado",
    shortTitle: "Importación Técnica",
    description: "Qué revisar antes de importar. Homologación técnica para minimizar riesgos.",
    level: 4,
    objectives: [
      "Evaluar productos antes de importar",
      "Entender procesos de homologación",
      "Minimizar riesgos técnicos en importación"
    ],
    topics: [
      "Evaluación pre-importación",
      "Homologación técnica",
      "Verificación de calidad",
      "Documentación requerida",
      "Gestión de riesgos"
    ],
    exercises: [
      "Evaluar 5 catálogos extranjeros",
      "Crear checklist de importación",
      "Simular proceso de homologación"
    ],
    duration: "3 horas",
    icon: "Ship"
  },
  {
    id: 13,
    title: "Distribución Inteligente",
    shortTitle: "Distribución",
    description: "Cobertura, zonas, rotación regional. Análisis de demanda para distribución efectiva.",
    level: 4,
    objectives: [
      "Planificar cobertura de distribución",
      "Analizar demanda por zonas",
      "Optimizar rotación regional"
    ],
    topics: [
      "Cobertura geográfica",
      "Segmentación por zonas",
      "Análisis de demanda regional",
      "Rotación por ubicación",
      "Logística de distribución"
    ],
    exercises: [
      "Análisis de demanda por zona",
      "Diseñar plan de cobertura",
      "Optimizar rutas de distribución"
    ],
    duration: "2.5 horas",
    icon: "Truck"
  },
  {
    id: 14,
    title: "Gestión Comercial para Almacenes",
    shortTitle: "Gestión Almacenes",
    description: "Cómo vender desde la ficha técnica. Cómo evitar devoluciones con información correcta.",
    level: 4,
    objectives: [
      "Vender usando fichas técnicas SRM",
      "Reducir devoluciones con asesoría correcta",
      "Mejorar rotación de inventario"
    ],
    topics: [
      "Ventas basadas en fichas técnicas",
      "Prevención de devoluciones",
      "Asesoría técnica efectiva",
      "Gestión de garantías",
      "Fidelización de clientes"
    ],
    exercises: [
      "Asesoría simulada con ficha técnica",
      "Manejo de casos de devolución",
      "Práctica de fidelización"
    ],
    duration: "2 horas",
    icon: "Store"
  },
  {
    id: 15,
    title: "Presentación Profesional de Catálogos SRM",
    shortTitle: "Presentación Catálogos",
    description: "Cómo entregar catálogo al cliente. Cómo empaquetar imágenes y crear mini-catálogos.",
    level: 4,
    objectives: [
      "Presentar catálogos de forma profesional",
      "Crear mini-catálogos personalizados",
      "Empaquetar imágenes correctamente"
    ],
    topics: [
      "Presentación profesional",
      "Creación de mini-catálogos",
      "Empaquetado de imágenes",
      "Personalización por cliente",
      "Formatos de entrega"
    ],
    exercises: [
      "Crear mini-catálogo SRM",
      "Preparar presentación para cliente",
      "Diseñar empaquetado de imágenes"
    ],
    duration: "2 horas",
    icon: "Presentation"
  },
  {
    id: 16,
    title: "SRM Intelligent Processor",
    shortTitle: "SRM Processor",
    description: "Normalizador, Extractor, Unificador, Renombrador, Fichas 360°. Pipeline completo.",
    level: 4,
    objectives: [
      "Dominar el pipeline SRM Intelligent",
      "Usar todas las herramientas del procesador",
      "Automatizar estandarización de catálogos"
    ],
    topics: [
      "Normalizador de datos",
      "Extractor de información",
      "Unificador de catálogos",
      "Renombrador automático",
      "Generador de Fichas 360°"
    ],
    exercises: [
      "Ejecutar pipeline simulado",
      "Procesar catálogo real",
      "Generar fichas 360° completas"
    ],
    duration: "4 horas",
    icon: "Cpu"
  },
  {
    id: 17,
    title: "Administración SRM para Empresas",
    shortTitle: "Administración SRM",
    description: "Panel para administradores. Carga de clientes y roles. Manejo de inventarios multiempresa.",
    level: 4,
    objectives: [
      "Administrar panel SRM empresarial",
      "Gestionar clientes y roles",
      "Manejar inventarios multiempresa"
    ],
    topics: [
      "Panel de administración",
      "Gestión de clientes",
      "Sistema de roles y permisos",
      "Inventarios multiempresa",
      "Reportes y métricas"
    ],
    exercises: [
      "Configurar panel administrativo",
      "Crear estructura de roles",
      "Simular gestión multiempresa"
    ],
    duration: "3 horas",
    icon: "Shield"
  },
  {
    id: 18,
    title: "SRM Shopify y e-Commerce",
    shortTitle: "SRM Shopify",
    description: "Cómo exportar catálogo a Shopify. Integración de imágenes, variantes, tags y filtros.",
    level: 5,
    objectives: [
      "Exportar catálogo SRM a Shopify",
      "Configurar productos con variantes",
      "Implementar filtros y tags efectivos"
    ],
    topics: [
      "Exportación a Shopify",
      "Integración de imágenes",
      "Configuración de variantes",
      "Sistema de tags SRM",
      "Filtros para e-commerce"
    ],
    exercises: [
      "Cargar 5 productos a Shopify",
      "Configurar variantes y precios",
      "Implementar filtros de categoría"
    ],
    duration: "3 horas",
    icon: "ShoppingCart"
  },
  {
    id: 19,
    title: "Caso Práctico por Rol",
    shortTitle: "Casos Prácticos",
    description: "Proyectos reales para cada rol: vendedor, mecánico, importador, distribuidor, almacén, fabricante.",
    level: 5,
    objectives: [
      "Aplicar conocimiento en casos reales",
      "Resolver problemas específicos del rol",
      "Demostrar competencia profesional"
    ],
    topics: [
      "Caso vendedor",
      "Caso mecánico",
      "Caso importador",
      "Caso distribuidor",
      "Caso almacén",
      "Caso fabricante"
    ],
    exercises: [
      "Resolver caso de tu rol",
      "Presentar solución completa",
      "Recibir retroalimentación"
    ],
    duration: "4 horas",
    icon: "Briefcase"
  },
  {
    id: 20,
    title: "Certificación SRM PRO",
    shortTitle: "Certificación PRO",
    description: "Examen final y proyecto: 'Organiza un catálogo real como SRM'. Certificación oficial.",
    level: 5,
    objectives: [
      "Aprobar examen final SRM",
      "Completar proyecto de certificación",
      "Obtener certificación SRM PRO"
    ],
    topics: [
      "Examen teórico integral",
      "Proyecto práctico supervisado",
      "Evaluación por agente Instructor",
      "Certificación oficial SRM"
    ],
    exercises: [
      "Examen final completo",
      "Proyecto: Organizar catálogo real",
      "Defensa de proyecto"
    ],
    duration: "8 horas",
    icon: "Award"
  }
];

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: number[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "talleres",
    name: "Ruta Talleres",
    description: "Diagnóstico, fichas técnicas y uso de SRM Intelligent para mecánicos profesionales.",
    icon: "Wrench",
    color: "from-blue-500 to-blue-600",
    modules: [1, 2, 4, 5, 10, 16]
  },
  {
    id: "almacenes",
    name: "Ruta Almacenes",
    description: "Gestión comercial, nomenclatura y psicología de ventas para almacenes técnicos.",
    icon: "Store",
    color: "from-green-500 to-green-600",
    modules: [1, 2, 3, 5, 8, 14]
  },
  {
    id: "distribuidores",
    name: "Ruta Distribuidores",
    description: "Catálogos, inventarios, distribución inteligente y e-commerce para distribuidores.",
    icon: "Truck",
    color: "from-yellow-500 to-yellow-600",
    modules: [1, 6, 7, 13, 18]
  },
  {
    id: "importadores",
    name: "Ruta Importadores",
    description: "Homologación técnica, catálogos extranjeros y presentación profesional.",
    icon: "Ship",
    color: "from-orange-500 to-orange-600",
    modules: [2, 6, 12, 7, 15]
  },
  {
    id: "fabricantes",
    name: "Ruta Fabricantes",
    description: "Fundamentos, nomenclatura avanzada, SRM Intelligent y certificación PRO.",
    icon: "Factory",
    color: "from-primary to-red-600",
    modules: [1, 2, 3, 16, 20]
  }
];

export function getModuleById(id: number): AcademiaModule | undefined {
  return ACADEMIA_MODULES.find(m => m.id === id);
}

export function getLevelById(id: number): AcademiaLevel | undefined {
  return ACADEMIA_LEVELS.find(l => l.id === id);
}

export function getModulesForLevel(levelId: number): AcademiaModule[] {
  const level = getLevelById(levelId);
  if (!level) return [];
  return level.modules.map(id => getModuleById(id)).filter(Boolean) as AcademiaModule[];
}
