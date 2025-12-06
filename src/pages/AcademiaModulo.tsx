import { useParams, Link } from "react-router-dom";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Target, 
  ListChecks, 
  CheckCircle2,
  Circle,
  ChevronRight,
  Play,
  GraduationCap,
  Wrench,
  Tag,
  Settings,
  FileText,
  Folder,
  Package,
  Brain,
  Users,
  Search,
  Warehouse,
  Ship,
  Truck,
  Store,
  Presentation,
  Cpu,
  Shield,
  ShoppingCart,
  Briefcase,
  Award,
  Factory,
  Star
} from "lucide-react";
import { getModuleById, getLevelById, ACADEMIA_MODULES } from "@/data/academia-modules";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, BookOpen, Tag, Settings, FileText, Folder, Package, Brain,
  Users, Search, Warehouse, Ship, Truck, Store, Presentation, Cpu,
  Shield, ShoppingCart, Briefcase, Award, Factory, Star, GraduationCap
};

export default function AcademiaModulo() {
  const { id } = useParams<{ id: string }>();
  const moduleId = parseInt(id || "1");
  const module = getModuleById(moduleId);
  const level = module ? getLevelById(module.level) : null;

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || BookOpen;
    return Icon;
  };

  if (!module || !level) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Módulo no encontrado</h1>
          <Link to="/academia">
            <Button>Volver a Academia</Button>
          </Link>
        </div>
        <FooterSRM />
      </div>
    );
  }

  const Icon = getIcon(module.icon);
  
  // Get previous and next modules
  const currentIndex = ACADEMIA_MODULES.findIndex(m => m.id === moduleId);
  const prevModule = currentIndex > 0 ? ACADEMIA_MODULES[currentIndex - 1] : null;
  const nextModule = currentIndex < ACADEMIA_MODULES.length - 1 ? ACADEMIA_MODULES[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {/* Hero Section */}
      <section className="pt-24 pb-8 bg-gradient-to-b from-steel-900 via-steel-800 to-background">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/academia" className="hover:text-foreground transition-colors">
              Academia SRM
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/academia" className="hover:text-foreground transition-colors">
              {level.name}: {level.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Módulo {module.id}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Module Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <Badge className="mb-2">Módulo {module.id}</Badge>
                  <h1 className="font-title text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground">
                    {module.title}
                  </h1>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                {module.description}
              </p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                  <Clock className="w-5 h-5 text-reliable" />
                  <span className="text-foreground font-medium">{module.duration}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{module.objectives.length} Objetivos</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                  <ListChecks className="w-5 h-5 text-green-500" />
                  <span className="text-foreground font-medium">{module.exercises.length} Ejercicios</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <Card className="w-full lg:w-80 bg-steel-800 border-steel-700">
              <CardHeader>
                <CardTitle className="text-foreground">Tu Progreso</CardTitle>
                <CardDescription>Módulo no iniciado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completado</span>
                    <span className="text-foreground font-medium">0%</span>
                  </div>
                  <Progress value={0} className="h-3" />
                </div>
                
                <Button className="w-full glow-red" size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Lección
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Objectives */}
              <Card className="bg-steel-800 border-steel-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-primary" />
                    <CardTitle className="text-foreground">Objetivos de Aprendizaje</CardTitle>
                  </div>
                  <CardDescription>Al completar este módulo podrás:</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {module.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Topics */}
              <Card className="bg-steel-800 border-steel-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-reliable" />
                    <CardTitle className="text-foreground">Contenido del Módulo</CardTitle>
                  </div>
                  <CardDescription>Temas que cubriremos en esta lección:</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {module.topics.map((topic, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-4 bg-steel-700/50 rounded-lg hover:bg-steel-700 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-steel-600 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {index + 1}
                        </div>
                        <span className="text-foreground font-medium flex-1">{topic}</span>
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Exercises */}
              <Card className="bg-steel-800 border-steel-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ListChecks className="w-6 h-6 text-green-500" />
                    <CardTitle className="text-foreground">Ejercicios Prácticos</CardTitle>
                  </div>
                  <CardDescription>Pon en práctica lo aprendido:</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {module.exercises.map((exercise, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-4 border border-steel-600 rounded-lg hover:border-green-500/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <ListChecks className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <span className="text-foreground font-medium">{exercise}</span>
                          <p className="text-sm text-muted-foreground">Pendiente de completar</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Iniciar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Level Info */}
              <Card className="bg-steel-800 border-steel-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center`}>
                      <span className="text-white font-bold">{level.id}</span>
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-lg">{level.name}</CardTitle>
                      <CardDescription>{level.title}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{level.description}</p>
                  <Link to="/academia">
                    <Button variant="outline" className="w-full">
                      Ver todos los módulos
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card className="bg-steel-800 border-steel-700">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Navegación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prevModule && (
                    <Link to={`/academia/modulo/${prevModule.id}`}>
                      <Button variant="ghost" className="w-full justify-start text-left h-auto py-3">
                        <ArrowLeft className="w-4 h-4 mr-3 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs text-muted-foreground">Anterior</p>
                          <p className="text-sm text-foreground truncate">{prevModule.shortTitle}</p>
                        </div>
                      </Button>
                    </Link>
                  )}
                  
                  <Separator />
                  
                  {nextModule && (
                    <Link to={`/academia/modulo/${nextModule.id}`}>
                      <Button variant="ghost" className="w-full justify-between text-left h-auto py-3">
                        <div className="overflow-hidden">
                          <p className="text-xs text-muted-foreground">Siguiente</p>
                          <p className="text-sm text-foreground truncate">{nextModule.shortTitle}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-3 flex-shrink-0" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Help */}
              <Card className="bg-gradient-to-br from-primary/20 to-reliable/20 border-primary/30">
                <CardContent className="p-6 text-center">
                  <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">¿Necesitas ayuda?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Consulta con el Agente Instructor SRM para resolver tus dudas.
                  </p>
                  <Link to="/intelligent">
                    <Button variant="outline" className="w-full">
                      Abrir Chat Instructor
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <FooterSRM />
    </div>
  );
}
