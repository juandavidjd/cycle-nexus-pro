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
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <SRMLogo className="h-12 w-12" />
              <span className="font-title font-extrabold text-foreground text-xl">SRM</span>
            </Link>
            <p className="font-body text-muted-foreground max-w-md">
              Tecnología + Catálogo Unificado + Conocimiento Técnico para la Industria de Motocicletas.
              Lógica de inventarios para ventas 360°.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="font-body text-muted-foreground hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="font-body text-muted-foreground hover:text-primary transition-colors">
                  Catálogo SRM
                </Link>
              </li>
              <li>
                <Link to="/clientes" className="font-body text-muted-foreground hover:text-primary transition-colors">
                  Clientes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 font-body text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@somosrepuestosmotos.com</span>
              </li>
              <li className="flex items-center gap-2 font-body text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>+57 300 000 0000</span>
              </li>
              <li className="flex items-center gap-2 font-body text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="divider-gradient my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-body text-muted-foreground">
          <p>© 2025 SRM — Somos Repuestos Motos. Todos los derechos reservados.</p>
          <p className="text-steel-500">Lógica de Inventarios 360°</p>
        </div>
      </div>
    </footer>
  );
}
