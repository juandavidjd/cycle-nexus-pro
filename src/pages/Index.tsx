import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { SRMButton } from "@/components/SRMButton";
import { ChatUploader } from "@/components/ChatUploader";
import { ChevronRight, Factory, Users, Database, Zap } from "lucide-react";
import srmLogoDiagonal from "@/assets/srm-logo-diagonal.png";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden dynamic-lines">
        {/* Background Effects */}
        <div className="absolute inset-0 industrial-grid opacity-30" />
        <div className="absolute inset-0 diagonal-stripes animate-diagonal-slide" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-8 animate-fade-up">
              <img 
                src={srmLogoDiagonal} 
                alt="SRM - Somos Repuestos Motos" 
                className="w-48 md:w-64 mx-auto drop-shadow-2xl"
              />
            </div>

            {/* Title */}
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-foreground mb-6 animate-fade-up-delay-1">
              <span className="text-primary glow-text-red">Tecnología</span>
              {" + "}
              <span className="text-secondary glow-text-blue">Catálogo Unificado</span>
              {" + "}
              <br className="hidden md:block" />
              <span className="text-foreground">Conocimiento Técnico</span>
            </h1>

            {/* Subclaim */}
            <p className="font-subtitle text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up-delay-2">
              <span className="text-primary font-semibold">Lógica de inventarios</span> para{" "}
              <span className="text-secondary font-semibold">ventas 360°</span>
            </p>

            {/* Single CTA Button */}
            <div className="flex justify-center animate-fade-up-delay-3">
              <SRMButton to="/catalogo" variant="primary" size="lg">
                Catálogo SRM
                <ChevronRight className="w-5 h-5" />
              </SRMButton>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-steel-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-4">
              Ecosistema <span className="text-primary">Unificado</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Conectamos fabricantes, importadores, distribuidores y talleres en una plataforma técnica integrada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Factory}
              title="Fabricantes"
              description="Conexión directa con marcas que diseñan y producen repuestos originales."
            />
            <FeatureCard
              icon={Database}
              title="Fichas Técnicas"
              description="Fichas y Terminología Técnica estandarizada para toda la industria."
            />
            <FeatureCard
              icon={Users}
              title="Red de Clientes"
              description="Distribuidores, importadores y talleres conectados al ecosistema."
            />
            <FeatureCard
              icon={Zap}
              title="Lógica 360°"
              description="Lógica de Inventarios para Ventas 360° en tiempo real."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="9+" label="Clientes Activos" color="primary" />
            <StatItem value="360°" label="Lógica de Inventarios" color="secondary" />
            <StatItem value="∞" label="Fichas y Terminología Técnica" color="primary" />
            <StatItem value="∞" label="Productos Integrados" color="secondary" />
          </div>
        </div>
      </section>

      {/* Chat Uploader Section */}
      <ChatUploader />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-steel-800/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-6">
              Explora el <span className="text-primary">Catálogo SRM</span>
            </h2>
            <p className="font-body text-muted-foreground mb-8">
              Accede a fichas técnicas, catálogos de productos y conexiones directas con tiendas oficiales.
            </p>
            <SRMButton to="/catalogo" variant="primary" size="lg">
              Ver Catálogo Completo
              <ChevronRight className="w-5 h-5" />
            </SRMButton>
          </div>
        </div>
      </section>

      <FooterSRM />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="card-industrial rounded-xl p-6 hover-lift text-center">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg text-foreground mb-2">{title}</h3>
      <p className="font-body text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

interface StatItemProps {
  value: string;
  label: string;
  color: "primary" | "secondary";
}

function StatItem({ value, label, color }: StatItemProps) {
  const colorClass = color === "primary" ? "text-primary glow-text-red" : "text-secondary glow-text-blue";
  
  return (
    <div className="text-center">
      <div className={`font-display font-extrabold text-4xl md:text-5xl mb-2 ${colorClass}`}>
        {value}
      </div>
      <div className="font-body text-muted-foreground text-sm">{label}</div>
    </div>
  );
}

export default Index;
