import { useState } from "react";
import { Link } from "react-router-dom";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Users, 
  ChevronRight,
  Wrench,
  Tag,
  Settings,
  FileText,
  Folder,
  Package,
  Brain,
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
  Factory,
  Star
} from "lucide-react";
import { 
  ACADEMIA_LEVELS, 
  ACADEMIA_MODULES, 
  LEARNING_PATHS,
  getModulesForLevel 
} from "@/data/academia-modules";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, BookOpen, Tag, Settings, FileText, Folder, Package, Brain,
  Users, Search, Warehouse, Ship, Truck, Store, Presentation, Cpu,
  Shield, ShoppingCart, Briefcase, Award, Factory, Star, GraduationCap
};

export default function Academia() {
  const [activeLevel, setActiveLevel] = useState("1");

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || BookOpen;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-steel-900 via-steel-800 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-primary font-subtitle font-semibold">Educación Técnica Profesional</span>
            </div>
            
            <h1 className="font-title text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6">
              Academia <span className="text-primary">SRM</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Formación técnica, comercial y operativa para la industria de motocicletas, 
              basada en la <span className="text-reliable">Lógica de Inventarios 360°</span> y 
              la terminología SRM.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                <BookOpen className="w-5 h-5 text-reliable" />
                <span className="text-foreground font-medium">20 Módulos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-foreground font-medium">5 Niveles</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                <Users className="w-5 h-5 text-green-500" />
                <span className="text-foreground font-medium">5 Rutas por Rol</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-steel-800 rounded-lg">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">Certificación PRO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Levels Overview */}
      <section className="py-12 bg-steel-900/50">
        <div className="container mx-auto px-4">
          <h2 className="font-title text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
            Niveles de Formación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ACADEMIA_LEVELS.map((level) => (
              <Card 
                key={level.id} 
                className="bg-steel-800 border-steel-700 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setActiveLevel(level.id.toString())}
              >
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <span className="text-white font-bold text-lg">{level.id}</span>
                  </div>
                  <CardTitle className="text-foreground text-lg">{level.name}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">{level.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{level.modules.length} módulos</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules by Level */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeLevel} onValueChange={setActiveLevel} className="space-y-8">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto p-0">
              {ACADEMIA_LEVELS.map((level) => (
                <TabsTrigger
                  key={level.id}
                  value={level.id.toString()}
                  className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-steel-800 text-muted-foreground hover:text-foreground transition-all"
                >
                  <span className="font-semibold">{level.name}:</span>
                  <span className="ml-2">{level.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {ACADEMIA_LEVELS.map((level) => (
              <TabsContent key={level.id} value={level.id.toString()} className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="font-title text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {level.title}
                  </h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">{level.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getModulesForLevel(level.id).map((module) => {
                    const Icon = getIcon(module.icon);
                    return (
                      <Card 
                        key={module.id} 
                        className="bg-steel-800 border-steel-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Módulo {module.id}
                            </Badge>
                          </div>
                          <CardTitle className="text-foreground text-lg leading-tight">
                            {module.title}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground text-sm line-clamp-2">
                            {module.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duración:</span>
                            <span className="text-foreground font-medium">{module.duration}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progreso</span>
                              <span className="text-muted-foreground">No iniciado</span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>

                          <Link to={`/academia/modulo/${module.id}`}>
                            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              Iniciar Lección
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 bg-steel-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-title text-2xl md:text-3xl font-bold text-foreground mb-4">
              Rutas de Aprendizaje por Rol
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Programas especializados diseñados para cada perfil profesional de la industria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {LEARNING_PATHS.map((path) => {
              const Icon = getIcon(path.icon);
              return (
                <Card 
                  key={path.id}
                  className="bg-steel-800 border-steel-700 hover:border-primary/50 transition-all group"
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${path.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-foreground">{path.name}</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      {path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      {path.modules.map((moduleId) => (
                        <Badge 
                          key={moduleId} 
                          variant="secondary"
                          className="text-xs"
                        >
                          M{moduleId}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      {path.modules.length} módulos • ~{path.modules.length * 2}h
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/20 to-reliable/20 border-primary/30">
            <CardContent className="p-8 md:p-12 text-center">
              <Award className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="font-title text-2xl md:text-3xl font-bold text-foreground mb-4">
                ¿Listo para certificarte como SRM PRO?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Completa todos los niveles, aprueba el examen final y obtén tu certificación 
                oficial como profesional del ecosistema SRM.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="glow-red">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Comenzar Nivel 1
                </Button>
                <Button size="lg" variant="outline">
                  Ver Requisitos PRO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <FooterSRM />
    </div>
  );
}
