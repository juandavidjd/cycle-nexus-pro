import { Link } from "react-router-dom";
import { Cog, Mail, Phone, MapPin } from "lucide-react";

export function FooterSRM() {
  return (
    <footer className="bg-steel-900 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Cog className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                <span className="text-primary">SRM</span>
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  Ecosistema Técnico
                </span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              Tecnología + Catálogo Unificado + Conocimiento Técnico para la Industria de Motocicletas.
              Conectando fabricantes, distribuidores y talleres en un solo ecosistema.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="text-muted-foreground hover:text-primary transition-colors">
                  Catálogo SRM
                </Link>
              </li>
              <li>
                <Link to="/clientes" className="text-muted-foreground hover:text-primary transition-colors">
                  Clientes SRM
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@srm-ecosystem.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>+57 300 000 0000</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="divider-gradient my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 SRM Ecosistema Técnico. Todos los derechos reservados.</p>
          <p className="text-steel-500">Pipeline SRM v28</p>
        </div>
      </div>
    </footer>
  );
}
