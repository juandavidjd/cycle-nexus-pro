import { useState, useEffect } from "react";
import { Client } from "@/types/client";
import { SRMButton } from "./SRMButton";
import { ArrowLeft, Store, Package, FileText, View, Loader2 } from "lucide-react";
import odiApi, { type ODIStoreSummary } from '@/lib/odiApi';

interface ClientLandingProps {
  client: Client;
}

export function ClientLanding({ client }: ClientLandingProps) {
  const [summary, setSummary] = useState<ODIStoreSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    odiApi.getStoreSummary(client.id)
      .then(data => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [client.id]);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Brand Colors */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${client.palette.accent} 0%, ${client.palette.primary}15 100%)`,
        }}
      >
        <div className="absolute inset-0 industrial-grid opacity-30" />
        <div className="absolute inset-0 diagonal-stripes opacity-50" />
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: client.palette.primary }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <SRMButton
            to="/catalogo"
            variant="ghost"
            size="sm"
            className="mb-8 text-steel-300 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catalogo SRM
          </SRMButton>

          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div
              className="w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-display font-extrabold text-white shrink-0"
              style={{
                backgroundColor: client.palette.primary,
                boxShadow: `0 0 60px ${client.palette.primary}40`,
              }}
            >
              {client.name.charAt(0)}
            </div>

            <div className="flex-1">
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-subtitle font-semibold mb-4"
                style={{
                  backgroundColor: `${client.palette.primary}30`,
                  color: client.palette.primary,
                }}
              >
                {client.type}
              </span>

              <h1 className="font-display font-extrabold text-4xl md:text-5xl text-foreground mb-4">
                {client.name}
              </h1>

              <p className="font-body text-steel-300 text-lg max-w-2xl mb-8">
                {summary
                  ? `${summary.stats.total_products.toLocaleString()} productos reales conectados al ecosistema ODI.`
                  : 'Conectado al ecosistema tecnico de motocicletas.'}
              </p>

              <div className="flex flex-wrap gap-4">
                <SRMButton
                  href={client.shopify}
                  variant="brand"
                  size="lg"
                  brandColor={client.palette.primary}
                  external
                >
                  <Store className="w-5 h-5" />
                  Tienda Shopify Oficial
                </SRMButton>

                <SRMButton
                  to="/catalogo"
                  variant="outline"
                  size="lg"
                >
                  Ver Mas Clientes
                </SRMButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Conectando con ODI...</span>
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Real Products */}
              <div className="card-industrial rounded-xl p-6 hover-lift">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${client.palette.primary}20` }}
                >
                  <Package className="w-6 h-6" style={{ color: client.palette.primary }} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">Productos</h3>
                <p className="font-display font-extrabold text-3xl mb-2" style={{ color: client.palette.primary }}>
                  {summary.stats.total_products.toLocaleString()}
                </p>
                <p className="font-body text-muted-foreground text-sm">productos en el ecosistema ODI</p>
              </div>

              {/* Top Categories */}
              <div className="card-industrial rounded-xl p-6 hover-lift">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${client.palette.primary}20` }}
                >
                  <FileText className="w-6 h-6" style={{ color: client.palette.primary }} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-3">Top Categorias</h3>
                <div className="space-y-2">
                  {summary.top_categories.slice(0, 4).map((cat) => (
                    <div key={cat.name} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="text-foreground font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Products */}
              <div className="card-industrial rounded-xl p-6 hover-lift">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${client.palette.primary}20` }}
                >
                  <View className="w-6 h-6" style={{ color: client.palette.primary }} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-3">Productos Recientes</h3>
                <div className="space-y-2">
                  {summary.recent_products.slice(0, 4).map((prod) => (
                    <div key={prod.sku} className="text-sm">
                      <span className="text-foreground">{(prod.nombre || prod.sku).slice(0, 35)}</span>
                      {prod.precio_cop > 0 && (
                        <span className="text-muted-foreground ml-1">
                          ${prod.precio_cop.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No se pudo conectar con ODI. Intenta de nuevo.
            </div>
          )}
        </div>
      </section>

      {/* Brand Stats */}
      <section className="py-16 bg-steel-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl text-foreground mb-4">
              Conectado al Ecosistema <span className="text-primary">ODI</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Datos reales del ecosistema de repuestos de motocicletas.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              value={summary ? summary.stats.total_products.toLocaleString() : '—'}
              label="Productos"
              color={client.palette.primary}
            />
            <StatCard
              value={summary ? String(summary.stats.categories) : '—'}
              label="Categorias"
              color={client.palette.primary}
            />
            <StatCard value="ODI" label="Ecosistema" color={client.palette.primary} />
            <StatCard value="API" label="Integracion" color={client.palette.primary} />
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  color: string;
}

function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="text-center p-6 rounded-xl bg-steel-800 border border-steel-700">
      <div className="font-display font-extrabold text-3xl mb-2" style={{ color }}>
        {value}
      </div>
      <div className="font-body text-muted-foreground text-sm">{label}</div>
    </div>
  );
}
