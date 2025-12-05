import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { SRMButton } from "@/components/SRMButton";
import { ChatUploader } from "@/components/ChatUploader";
import { ChevronRight, Factory, Users, Database, Zap, Cpu } from "lucide-react";

// Carousel images in order
import srmA from "@/assets/carousel/SRM_A.png";
import srmB from "@/assets/carousel/SRM_B.png";
import srmC from "@/assets/carousel/SRM_C.png";
import srmD from "@/assets/carousel/SRM_D.png";
import srmE from "@/assets/carousel/SRM_E.png";
import srmF from "@/assets/carousel/SRM_F.png";
import srmG from "@/assets/carousel/SRM_G.png";
import srmH from "@/assets/carousel/SRM_H.png";
import srmHM from "@/assets/carousel/SRM_HM.png";
import srmI from "@/assets/carousel/SRM_I.png";
import srmJ from "@/assets/carousel/SRM_J.png";
import srmM2 from "@/assets/carousel/SRM_M2.png";
import srmNO from "@/assets/carousel/SRM_NO.png";
import srmO from "@/assets/carousel/SRM_O.png";
import srmOP from "@/assets/carousel/SRM_OP.png";
import srm3 from "@/assets/carousel/SRM_3.png";

const carouselImages = [srmA, srmB, srmC, srmD, srmE, srmF, srmG, srmH, srmHM, srmI, srmJ, srmM2, srmNO, srmO, srmOP, srm3];

const Index = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />

      {/* Fixed mural carousel background */}
      <div className="fixed inset-0 z-0">
        {carouselImages.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${img})`,
              opacity: index === currentImageIndex ? 1 : 0,
            }}
          />
        ))}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* Main scrollable content */}
      <div className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Title */}
              <h1 className="font-display font-extrabold text-4xl md:text-6xl text-foreground mb-6 animate-fade-up">
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

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center gap-4 animate-fade-up-delay-3">
                <SRMButton to="/catalogo" variant="primary" size="lg">
                  Catálogo SRM
                  <ChevronRight className="w-5 h-5" />
                </SRMButton>
                <SRMButton to="/intelligent" variant="secondary" size="lg">
                  <Cpu className="w-5 h-5" />
                  SRM Intelligent
                </SRMButton>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 z-10">
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
        <section className="relative py-24 z-10">
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
        <section className="relative py-24">
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
      </div>

      <FooterSRM className="relative z-10" />
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