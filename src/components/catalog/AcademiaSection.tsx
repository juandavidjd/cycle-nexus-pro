import { GraduationCap, BookOpen, FileText, Newspaper, Award, ArrowRight } from "lucide-react";
import { ACADEMIA_SECTIONS } from "@/data/catalog-categories";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  BookOpen,
  FileText,
  Newspaper,
  Award,
};

export function AcademiaSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-steel-800/50 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-srm-blue/20 text-srm-blue text-sm font-subtitle font-semibold mb-4">
            <GraduationCap className="w-4 h-4" />
            Nuevo
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-4">
            Academia <span className="text-primary">SRM</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">
            Formación técnica especializada para profesionales de la industria de motocicletas
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ACADEMIA_SECTIONS.map((section) => {
            const IconComponent = iconMap[section.icon] || BookOpen;
            return (
              <div
                key={section.id}
                className="group relative overflow-hidden rounded-xl bg-steel-800/50 border border-steel-700 p-6 hover:border-srm-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-srm-blue/10 cursor-pointer"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-srm-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-srm-blue/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-srm-blue" />
                  </div>
                  
                  <h3 className="font-subtitle font-semibold text-foreground mb-2 group-hover:text-srm-blue transition-colors">
                    {section.title}
                  </h3>
                  
                  <p className="font-body text-steel-400 text-sm mb-4">
                    {section.description}
                  </p>
                  
                  <div className="flex items-center gap-1 text-srm-blue text-sm font-subtitle font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explorar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Badge */}
        <div className="text-center mt-8">
          <span className="inline-block px-4 py-2 rounded-full bg-steel-700/50 text-steel-400 text-sm font-body">
            🚀 Próximamente: Certificaciones oficiales y cursos interactivos
          </span>
        </div>
      </div>
    </section>
  );
}
