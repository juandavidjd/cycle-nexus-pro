import { useState } from 'react';
import { Upload, MessageSquare, GitBranch, Cpu, Sparkles, Zap, Bot } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { FooterSRM } from '@/components/FooterSRM';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SRMIntelligentProcessor } from '@/components/intelligent/SRMIntelligentProcessor';
import { SRMTechnicalChat } from '@/components/intelligent/SRMTechnicalChat';
import { SRMPipelineVisual } from '@/components/intelligent/SRMPipelineVisual';
import { SRMAgentsSuite } from '@/components/agents/SRMAgentsSuite';

const Intelligent = () => {
  const [activeTab, setActiveTab] = useState('processor');

  const scrollToSection = (tab: string) => {
    setActiveTab(tab);
    const element = document.getElementById('intelligent-content');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 dynamic-lines" />
        <div className="absolute inset-0 diagonal-stripes animate-diagonal-slide" />
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-steel-800 border border-steel-700 mb-8 animate-fade-up">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Procesamiento Inteligente</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                v1.0
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6 animate-fade-up-delay-1">
              <span className="text-foreground">SRM </span>
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Intelligent
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-subtitle animate-fade-up-delay-2">
              Procesa, estandariza y transforma catálogos en información técnica SRM
            </p>
            <p className="text-lg text-steel-400 mb-10 animate-fade-up-delay-3">
              Lógica de Inventarios para Ventas 360°
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 animate-fade-up-delay-3">
              <Button
                size="lg"
                onClick={() => scrollToSection('processor')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                <Upload className="w-5 h-5 mr-2" />
                Cargar Catálogo
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('chat')}
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Abrir Chat Técnico
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => scrollToSection('pipeline')}
                className="text-muted-foreground hover:text-foreground"
              >
                <GitBranch className="w-5 h-5 mr-2" />
                Ver Pipeline SRM
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-steel-900/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: 'Estandarización Automática',
                description: 'Transforma nomenclaturas variadas en terminología técnica unificada SRM.',
                color: 'primary',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Fitment Inteligente',
                description: 'Detecta compatibilidad con marcas, modelos y años automáticamente.',
                color: 'secondary',
              },
              {
                icon: <Cpu className="w-6 h-6" />,
                title: 'Fichas Técnicas 360°',
                description: 'Genera fichas completas con atributos, descripciones y galería.',
                color: 'primary',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-steel-700 hover-lift"
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-4
                  ${feature.color === 'primary' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}
                `}>
                  {feature.icon}
                </div>
                <h3 className="font-subtitle font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="intelligent-content" className="py-20">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid grid-cols-3 mb-8 bg-steel-800 p-1 rounded-xl">
              <TabsTrigger
                value="processor"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Procesador
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground rounded-lg"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat Técnico
              </TabsTrigger>
              <TabsTrigger
                value="pipeline"
                className="data-[state=active]:bg-steel-600 rounded-lg"
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Pipeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="processor" className="animate-fade-up">
              <div className="bg-card rounded-2xl border border-steel-700 p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    SRM Intelligent Processor
                  </h2>
                  <p className="text-muted-foreground">
                    Carga tus catálogos y SRM los estandariza automáticamente
                  </p>
                </div>
                <SRMIntelligentProcessor />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="animate-fade-up">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    SRM Technical Chat
                  </h2>
                  <p className="text-muted-foreground">
                    Consulta técnica inteligente con asistente SRM
                  </p>
                </div>
                <SRMTechnicalChat />
              </div>
            </TabsContent>

            <TabsContent value="pipeline" className="animate-fade-up">
              <div className="bg-card rounded-2xl border border-steel-700 p-6 md:p-8">
                <div className="mb-8 text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    Pipeline Visual SRM
                  </h2>
                  <p className="text-muted-foreground">
                    Flujo completo de procesamiento de catálogos
                  </p>
                </div>
                
                <SRMPipelineVisual />

                {/* Pipeline Description */}
                <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      step: '01',
                      title: 'Ingesta',
                      description: 'Recepción de archivos en múltiples formatos: Excel, CSV, PDF, imágenes, ZIP.',
                    },
                    {
                      step: '02',
                      title: 'Extracción',
                      description: 'Parsing inteligente de datos estructurados y no estructurados.',
                    },
                    {
                      step: '03',
                      title: 'Normalización',
                      description: 'Limpieza, deduplicación y estandarización de campos.',
                    },
                    {
                      step: '04',
                      title: 'Unificación',
                      description: 'Clasificación bajo taxonomía técnica SRM unificada.',
                    },
                    {
                      step: '05',
                      title: 'Enriquecimiento',
                      description: 'Adición de fitment, atributos técnicos y descripciones.',
                    },
                    {
                      step: '06',
                      title: 'Ficha 360°',
                      description: 'Generación de ficha técnica completa lista para publicación.',
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="p-4 rounded-xl bg-steel-800/50 border border-steel-700"
                    >
                      <span className="text-3xl font-display font-bold text-primary/30">
                        {item.step}
                      </span>
                      <h4 className="font-subtitle font-semibold text-foreground mt-2 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Multi-Agent Suite */}
      <section className="bg-steel-900/70 border-t border-steel-700">
        <SRMAgentsSuite />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '9+', label: 'Clientes Activos' },
              { value: '360°', label: 'Lógica de Inventarios' },
              { value: '∞', label: 'Productos Integrados' },
              { value: '100%', label: 'Automatización' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterSRM />
    </div>
  );
};

export default Intelligent;
