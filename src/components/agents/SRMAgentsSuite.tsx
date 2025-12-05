import React, { useState } from 'react';
import { Mic, Palette, GraduationCap, Brain, Building2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AgentChat } from './AgentChat';

const agents = [
  {
    id: 'voice',
    name: 'SRM Voice Assistant',
    shortName: 'Voice',
    icon: Mic,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Narrador técnico-comercial para ElevenLabs',
    capabilities: ['Guiones para videos', 'Tutoriales de voz', 'Cápsulas educativas'],
    placeholder: 'Ejemplo: "Crea un guión de 60 segundos para explicar el SRM Intelligent Processor a mecánicos de taller"',
  },
  {
    id: 'designer',
    name: 'SRM Designer Bot',
    shortName: 'Designer',
    icon: Palette,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Director de arte digital para Freepik/Canva',
    capabilities: ['Banners y creativos', 'Cards de clientes', 'Miniaturas Academia'],
    placeholder: 'Ejemplo: "Diseña un banner para el lanzamiento de SRM Intelligent con dimensiones 1200x628"',
  },
  {
    id: 'instructor',
    name: 'SRM Instructor',
    shortName: 'Instructor',
    icon: GraduationCap,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Profesor principal de Academia SRM',
    capabilities: ['Temarios de cursos', 'Módulos de formación', 'Ejercicios prácticos'],
    placeholder: 'Ejemplo: "Crea el temario del curso Fundamentos SRM para vendedores de almacén"',
  },
  {
    id: 'sales',
    name: 'SRM Sales Psychology',
    shortName: 'Sales',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Experto en PNL y neuromarketing',
    capabilities: ['Copys persuasivos', 'Versiones A/B', 'CTAs optimizados'],
    placeholder: 'Ejemplo: "Reescribe este texto con enfoque de neuromarketing: Explora nuestro catálogo de repuestos"',
  },
  {
    id: 'architect',
    name: 'SRM Product Architect',
    shortName: 'Architect',
    icon: Building2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Arquitecto funcional del sistema',
    capabilities: ['Diseño de roles', 'Flujos de pantalla', 'Especificaciones técnicas'],
    placeholder: 'Ejemplo: "Diseña el panel de acceso por roles para clientes SRM con tabla de permisos"',
  },
];

export const SRMAgentsSuite: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState('voice');
  const currentAgent = agents.find(a => a.id === activeAgent)!;

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            IA Funcional
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            SRM Multi-Agent Suite
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            5 agentes especializados con IA real que trabajan coordinados para construir 
            interfaces, contenidos y flujos de SRM.
          </p>
        </div>

        {/* Agent Tabs */}
        <Tabs value={activeAgent} onValueChange={setActiveAgent} className="w-full">
          <TabsList className="w-full flex flex-wrap justify-center gap-2 h-auto bg-transparent mb-8">
            {agents.map((agent) => (
              <TabsTrigger
                key={agent.id}
                value={agent.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/10 ${agent.bgColor}`}
              >
                <agent.icon className={`w-5 h-5 ${agent.color}`} />
                <span className="hidden sm:inline">{agent.shortName}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {agents.map((agent) => (
            <TabsContent key={agent.id} value={agent.id} className="mt-0">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Agent Info Card */}
                <Card className="lg:col-span-1 border-border/50">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${agent.bgColor} flex items-center justify-center mb-3`}>
                      <agent.icon className={`w-6 h-6 ${agent.color}`} />
                    </div>
                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-medium text-foreground mb-3">Capacidades:</h4>
                    <ul className="space-y-2">
                      {agent.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ChevronRight className={`w-4 h-4 ${agent.color}`} />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Chat Interface */}
                <div className="lg:col-span-2">
                  <AgentChat
                    agentType={agent.id}
                    agentName={agent.name}
                    placeholder={agent.placeholder}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};
