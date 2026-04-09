import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { SRMLogo } from "@/components/SRMLogo";
import { cn } from "@/lib/utils";

interface FooterSRMProps {
  className?: string;
}

export function FooterSRM({ className }: FooterSRMProps) {
  return (
    <footer className={cn("bg-steel-900 border-t border-steel-700 mt-auto", className)}>
      <div className="container mx-auto px-6 md:px-4 py-8 md:py-10">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <SRMLogo className="h-8 w-8" />
              <span className="font-display font-bold text-foreground text-lg">SRM</span>
            </Link>
            <p className="font-body text-muted-foreground text-sm max-w-xs leading-relaxed">
              Tecnología + Catálogo Unificado + Conocimiento Técnico para la Industria de Motocicletas.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 md:gap-8">
            <Link to="/" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link to="/catalogo" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
              Catálogo
            </Link>
            <Link to="/clientes" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
              Clientes
            </Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2 text-sm">
            <a href="mailto:info@somosrepuestosmotos.com" className="flex items-center gap-2 font-body text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <span>info@somosrepuestosmotos.com</span>
            </a>
            <div className="flex items-center gap-2 font-body text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Colombia</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-steel-700 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 SRM — Somos Repuestos Motos. Todos los derechos reservados.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-steel-700">
            Un proyecto del ecosistema{" "}
            <a href="https://ecosistema-adsi.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground underline">
              ADSI-ODI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
