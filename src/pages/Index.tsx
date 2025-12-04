import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { SRMButton } from "@/components/SRMButton";
import { Cog, ChevronRight, Factory, Users, Database, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 industrial-grid opacity-40" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-srm-blue-glow/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
              <Cog className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-primary text-sm font-medium">Ecosistema Técnico de Motocicletas</span>
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-5xl md:text-7xl text-foreground mb-6 animate-fade-up-delay-1">
              <span className="text-primary glow-text">SRM</span>
              <br />
              <span className="text-steel-300">Pipeline Técnico</span>
            </h1>

            {/* Claim */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up-delay-2">
              <span className="text-foreground font-semibold">Tecnología</span> + {" "}
              <span className="text-foreground font-semibold">Catálogo Unificado</span> + {" "}
              <span className="text-foreground font-semibold">Conocimiento Técnico</span>
              <br />
              para la Industria de Motocicletas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay-3">
              <SRMButton to="/catalogo" variant="primary" size="lg">
                Catálogo SRM
                <ChevronRight className="w-5 h-5" />
              </SRMButton>
              <SRMButton to="/clientes" variant="outline" size="lg">
                Clientes SRM
                <Users className="w-5 h-5" />
              </SRMButton>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-steel-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Ecosistema Unificado
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
              title="Catálogo Técnico"
              description="Base de datos unificada con fichas técnicas y compatibilidades."
            />
            <FeatureCard
              icon={Users}
              title="Red de Clientes"
              description="Distribuidores, importadores y talleres conectados al ecosistema."
            />
            <FeatureCard
              icon={Zap}
              title="Pipeline v28"
              description="Tecnología de última generación para gestión de catálogo."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="9+" label="Clientes Activos" />
            <StatItem value="v28" label="Pipeline Técnico" />
            <StatItem value="360°" label="Fichas Técnicas" />
            <StatItem value="∞" label="Productos Integrados" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-steel-800/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6">
              Explora el Catálogo SRM
            </h2>
            <p className="text-muted-foreground mb-8">
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
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="font-display font-bold text-4xl md:text-5xl text-primary mb-2 glow-text">
        {value}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}

export default Index;
