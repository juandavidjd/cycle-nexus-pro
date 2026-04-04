import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Store, Workflow, Cpu,
  Activity, Server, ChevronRight, Shield,
} from "lucide-react";
import {
  managerApi,
  type ManagerDashboard,
  type ManagerFlow,
  type ManagerFlowDetail,
  type ManagerFlowCategory,
  type ManagerOrganism,
  type ManagerStoreAudit,
} from "@/lib/odiApi";

// ── Grade colors ──
function gradeColor(g: string) {
  if (g === "A+") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (g === "A")  return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (g === "B")  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (g === "C")  return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function statusColor(s: string) {
  if (s === "alive" || s === "healthy") return "bg-emerald-500";
  if (s === "degraded" || s === "unconfigured") return "bg-amber-500";
  return "bg-red-500";
}

function readinessStyle(r: string) {
  const l = (r || "designed").toLowerCase();
  if (l === "live")    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (l === "partial") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-secondary/15 text-blue-400 border-secondary/30";
}

// ── Hooks ──
function useDashboard() {
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

function useLive() {
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    const ping = () => {
      managerApi.health().then(() => setLive(true)).catch(() => setLive(false));
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => clearInterval(id);
  }, []);

  return live;
}

// ── Tab: Tiendas ──
function TabTiendas({ dashboard, onSelect }: { dashboard: ManagerDashboard | null; onSelect: (id: string) => void }) {
  if (!dashboard) return <p className="text-muted-foreground text-sm py-8 text-center">Cargando tiendas…</p>;
  const stores = dashboard.stores || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {stores.map(s => {
        const pct = s.total > 0 ? Math.round((s.active / s.total) * 100) : 0;
        return (
          <Card
            key={s.store_id}
            className="cursor-pointer hover:border-primary/50 transition-colors bg-card"
            onClick={() => onSelect(s.store_id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">{s.display_name || s.store_id.toUpperCase()}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.shop || "sin dominio"}</p>
                </div>
                <Badge variant="outline" className={gradeColor(s.grade)}>{s.grade || "—"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-6">
                <div>
                  <p className="text-lg font-bold text-emerald-400">{s.active.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Activos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">{s.draft}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Draft</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{s.total.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={pct} className="h-1" />
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor(s.status)}`} />
                    <span className="text-[10px] text-muted-foreground">{s.status || "—"}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pct}% activo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Tab: Servicios ──
function TabServicios({ dashboard }: { dashboard: ManagerDashboard | null }) {
  if (!dashboard) return <p className="text-muted-foreground text-sm py-8 text-center">Cargando servicios…</p>;
  const services = dashboard.services || {};
  const entries = Object.entries(services).filter(([k]) => k !== "_summary");
  const summary = (services as Record<string, unknown>)._summary as { total: number; alive: number; dead: number } | undefined;

  return (
    <div className="space-y-4">
      {summary && (
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-emerald-400">{summary.alive}</span>/{summary.total} servicios vivos
          {summary.dead > 0 && <span className="text-red-400 ml-3">{summary.dead} caídos</span>}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {entries.map(([k, v]) => (
          <Card key={k} className="bg-card">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">{v.label || k}</p>
              <p className="text-xs text-muted-foreground font-mono">:{v.port}</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusColor(v.status)}`} />
                <span className={`text-xs font-semibold ${v.status === "alive" ? "text-emerald-400" : v.status === "dead" ? "text-red-400" : "text-amber-400"}`}>
                  {v.status?.toUpperCase()} {v.code > 0 ? `(${v.code})` : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Flows ──
function TabFlows({ onSelect }: { onSelect: (id: string) => void }) {
  const [flows, setFlows] = useState<ManagerFlow[]>([]);
  const [categories, setCategories] = useState<ManagerFlowCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([managerApi.flows(), managerApi.categories()])
      .then(([f, c]) => { setFlows(f); setCategories(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Cargando flows…</p>;

  const byCat: Record<string, ManagerFlow[]> = {};
  flows.forEach(f => {
    const cat = f.category || "other";
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(f);
  });

  const catMeta: Record<string, ManagerFlowCategory> = {};
  categories.forEach(c => { catMeta[c.id] = c; });

  return (
    <div className="space-y-8">
      {Object.entries(byCat).map(([cat, catFlows]) => {
        const meta = catMeta[cat];
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <span className="text-lg">{meta?.icon || ""}</span>
              <h3 className="text-sm font-bold">{meta?.label || cat.toUpperCase()}</h3>
              <span className="text-xs text-muted-foreground ml-auto">{catFlows.length} flows</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {catFlows.map(f => (
                <Card
                  key={f.flow_id}
                  className="cursor-pointer hover:border-primary/50 transition-colors bg-card"
                  onClick={() => onSelect(f.flow_id)}
                >
                  <CardContent className="p-4 space-y-2">
                    <p className="text-[10px] text-muted-foreground font-mono">{f.flow_id}</p>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={readinessStyle(f.readiness)}>
                        {f.readiness || "designed"}
                      </Badge>
                      {f.steps_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">{f.steps_count} steps</span>
                      )}
                      <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Organismos ──
function TabOrganismos() {
  const [organisms, setOrganisms] = useState<ManagerOrganism[]>([]);
  const [readiness, setReadiness] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.organisms()
      .then(d => { setOrganisms(d.organisms); setReadiness(d.readiness); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Cargando organismos…</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        {Object.entries(readiness).map(([k, v]) => (
          <span key={k} className="text-xs text-muted-foreground">
            <strong className="text-foreground">{v}</strong> {k}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organisms.map(o => (
          <Card key={o.organism_id} className="bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">{o.label || o.organism_id}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{o.organism_id}</p>
                </div>
                <Badge variant="outline" className={readinessStyle(o.readiness)}>
                  {o.readiness || "designed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-6">
                {o.services_count != null && (
                  <div>
                    <p className="text-lg font-bold">{o.services_count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Servicios</p>
                  </div>
                )}
                {o.flows_count != null && (
                  <div>
                    <p className="text-lg font-bold">{o.flows_count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Flows</p>
                  </div>
                )}
              </div>
              {o.services?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {o.services.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-secondary/15 text-blue-400 border border-secondary/20">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Guardian V2.1.1 — 5 Frentes con Semáforo Independiente ──
function TabGuardian() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.guardian()
      .then(d => setData(d as Record<string, any>))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Cargando Guardian…</p>;
  if (!data) return <p className="text-muted-foreground text-sm py-8 text-center">Sin datos</p>;

  const eco = (data.ecosystem || {}) as Record<string, any>;
  const fronts = (eco.fronts || {}) as Record<string, any>;
  const storesDetail = ((data.fronts_detail || {}) as Record<string, any>).stores || {};
  const configured = (storesDetail.configured || []) as Record<string, any>[];
  const unconfigured = (storesDetail.unconfigured || []) as Record<string, any>[];

  const sColors: Record<string, string> = { verde: "bg-emerald-500", amarillo: "bg-yellow-500", naranja: "bg-orange-500", rojo: "bg-red-500", gris: "bg-muted" };
  const sText: Record<string, string> = { verde: "text-emerald-400", amarillo: "text-yellow-400", naranja: "text-orange-400", rojo: "text-red-400", gris: "text-muted-foreground" };
  const sBar: Record<string, string> = { verde: "bg-emerald-500", amarillo: "bg-yellow-500", naranja: "bg-orange-500", rojo: "bg-red-500", gris: "bg-muted" };
  const frontLabels: Record<string, string> = { stores: "Stores", services: "Services", agent: "Agent", ces: "CES", radar: "Radar" };

  return (
    <div className="space-y-6">
      {/* Semáforo global */}
      <Card className="bg-card text-center py-6">
        <CardContent className="space-y-3">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${sColors[eco.semaphore as string] || "bg-muted"}`}>
            <span className="text-2xl font-extrabold text-white">{eco.health_index}</span>
          </div>
          <p className={`text-sm font-bold uppercase tracking-wide ${sText[eco.semaphore as string] || "text-muted-foreground"}`}>
            {eco.semaphore as string}
          </p>
          <p className="text-xs text-muted-foreground">Health Index Ecosistema</p>
          {eco.summary && (eco.semaphore as string) !== "verde" && (
            <div className="mx-auto max-w-md text-left text-xs px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
              {eco.summary as string}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5 Frentes */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Frentes del Ecosistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["stores", "services", "agent", "ces", "radar"].map(name => {
            const f = fronts[name] || {};
            const pct = Math.round((f.health || 0) * 100);
            const sem = f.semaphore as string || "gris";
            return (
              <div key={name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${sBar[sem] || "bg-muted"}`} />
                    <span className="text-sm font-semibold">{frontLabels[name] || name}</span>
                  </div>
                  <span className={`text-sm font-bold ${sText[sem] || "text-muted-foreground"}`}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${sBar[sem] || "bg-muted"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{f.summary as string || "—"}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Tiendas configuradas */}
      {configured.length > 0 && (
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Tiendas Configuradas ({configured.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {configured.map((s: Record<string, any>) => (
              <div key={s.store_id as string} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sColors[s.semaforo as string] || "bg-muted"}`} />
                <span className="font-semibold w-20">{(s.store_id as string).toUpperCase()}</span>
                <Badge variant="outline" className={gradeColor(s.grade as string)}>{s.grade as string || "—"}</Badge>
                <span className="text-emerald-400 text-xs ml-auto">{(s.active as number).toLocaleString()} activos</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tiendas sin configurar — gris neutro */}
      {unconfigured.length > 0 && (
        <Card className="bg-card border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide">
              Sin Configurar ({unconfigured.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {unconfigured.map((s: Record<string, any>) => (
                <div key={s.store_id as string} className="flex items-center gap-2.5 py-1 text-xs text-muted-foreground/60">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-muted" />
                  <span>{(s.store_id as string).toUpperCase()}</span>
                  {(s.draft as number) > 0 && <span className="ml-auto">{s.draft as number} drafts</span>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/40 italic mt-3">
              Estas tiendas no tienen productos activos. No representan riesgo.
            </p>
          </CardContent>
        </Card>
      )}

      {data.nota_etica && (
        <p className="text-[10px] text-muted-foreground italic text-center">{data.nota_etica as string}</p>
      )}
    </div>
  );
}

// ── Detail Sheets ──
function StoreAuditSheet({ storeId, open, onClose }: { storeId: string; open: boolean; onClose: () => void }) {
  const [audit, setAudit] = useState<ManagerStoreAudit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !storeId) return;
    setLoading(true);
    setAudit(null);
    managerApi.auditStore(storeId).then(setAudit).catch(() => {}).finally(() => setLoading(false));
  }, [open, storeId]);

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-[400px] sm:w-[480px] bg-background border-border">
        <SheetHeader>
          <SheetTitle>{storeId.toUpperCase()}</SheetTitle>
          <SheetDescription>Auditoría Shopify en tiempo real</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {loading && <p className="text-sm text-muted-foreground py-4">Auditando…</p>}
          {!loading && audit && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Grade</p>
                <Badge variant="outline" className={`text-base px-4 py-1 ${gradeColor(audit.grade)}`}>
                  {audit.grade || "—"}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Catálogo</p>
                <div className="space-y-1">
                  {(["active", "draft", "archived", "total"] as const).map(k => (
                    <div key={k} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="capitalize text-muted-foreground">{k}</span>
                      <strong>{audit.catalog[k] ?? "—"}</strong>
                    </div>
                  ))}
                </div>
              </div>
              {audit.issues.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Issues</p>
                    <div className="flex flex-wrap gap-1.5">
                      {audit.issues.map(i => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function FlowDetailSheet({ flowId, open, onClose }: { flowId: string; open: boolean; onClose: () => void }) {
  const [flow, setFlow] = useState<ManagerFlowDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !flowId) return;
    setLoading(true);
    setFlow(null);
    managerApi.flowDetail(flowId).then(setFlow).catch(() => {}).finally(() => setLoading(false));
  }, [open, flowId]);

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-[440px] sm:w-[520px] bg-background border-border">
        <SheetHeader>
          <SheetTitle>{flow?.label || flowId}</SheetTitle>
          <SheetDescription>{flow?.description || flowId}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {loading && <p className="text-sm text-muted-foreground py-4">Cargando…</p>}
          {!loading && flow?.steps && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Steps ({flow.steps.length})
              </p>
              {flow.steps.map((s, i) => {
                const role = s.phase || s.role || "—";
                const isOdi = role === "odi";
                const isUser = role === "user";
                const isIface = role.includes("interface");
                return (
                  <Card key={i} className="bg-card">
                    <CardContent className="p-3 space-y-1.5">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isOdi ? "text-blue-400" : isUser ? "text-emerald-400" : isIface ? "text-amber-400" : "text-muted-foreground"}`}>
                        {isOdi ? "ODI" : isUser ? "Usuario" : isIface ? "Interfaz" : role}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {s.text || <span className="text-muted-foreground italic">—</span>}
                      </p>
                      {(s.voice || s.mode || s.system_action) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {s.voice && <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/15 text-blue-400 border border-secondary/20">voice: {s.voice}</span>}
                          {s.mode && <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/15 text-blue-400 border border-secondary/20">mode: {s.mode}</span>}
                          {s.system_action && <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/15 text-blue-400 border border-secondary/20">{JSON.stringify(s.system_action)}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════
// Manager Page
// ══════════════════════════════════════════════════════════
const Manager = () => {
  const navigate = useNavigate();
  const live = useLive();
  const { data: dashboard, loading: dashLoading } = useDashboard();

  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedFlow, setSelectedFlow] = useState<string>("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold tracking-wide">ODI Manager</h1>
            <span className="text-[10px] text-muted-foreground">CATRMU-ADSI-ODI</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${live === true ? "bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]" : live === false ? "bg-red-500" : "bg-muted-foreground"}`}
              style={live === true ? { animation: "pulse 2s infinite" } : undefined}
            />
            <span className={`text-xs font-semibold ${live === true ? "text-emerald-400" : live === false ? "text-red-400" : "text-muted-foreground"}`}>
              {live === true ? "LIVE" : live === false ? "OFFLINE" : "···"}
            </span>
          </div>
        </div>
      </header>

      {/* Summary bar */}
      {dashboard && (
        <div className="border-b border-border bg-card/40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-8 overflow-x-auto">
            {[
              { val: dashboard.stores_total, lbl: "Tiendas", icon: Store },
              { val: (dashboard.products_active || 0).toLocaleString(), lbl: "Activos", icon: Activity },
              { val: dashboard.flows_total, lbl: "Flows", icon: Workflow },
              { val: dashboard.organisms_total, lbl: "Organismos", icon: Cpu },
              { val: (dashboard.services as Record<string, unknown>)?._summary ? ((dashboard.services as Record<string, unknown>)._summary as Record<string, number>)?.alive : "—", lbl: "Servicios", icon: Server },
            ].map(({ val, lbl, icon: Icon }) => (
              <div key={lbl} className="flex items-center gap-2 shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold leading-none text-primary">{val}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{lbl}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {dashLoading && !dashboard && (
        <div className="border-b border-border bg-card/40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <p className="text-sm text-muted-foreground animate-pulse">Conectando a la API…</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="tiendas">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="tiendas" className="text-xs gap-1.5">
              <Store className="w-3.5 h-3.5" /> Tiendas
            </TabsTrigger>
            <TabsTrigger value="servicios" className="text-xs gap-1.5">
              <Server className="w-3.5 h-3.5" /> Servicios
            </TabsTrigger>
            <TabsTrigger value="flows" className="text-xs gap-1.5">
              <Workflow className="w-3.5 h-3.5" /> Flows
            </TabsTrigger>
            <TabsTrigger value="organismos" className="text-xs gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Organismos
            </TabsTrigger>
            <TabsTrigger value="guardian" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Guardian
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiendas">
            <TabTiendas dashboard={dashboard} onSelect={id => setSelectedStore(id)} />
          </TabsContent>
          <TabsContent value="servicios">
            <TabServicios dashboard={dashboard} />
          </TabsContent>
          <TabsContent value="flows">
            <TabFlows onSelect={id => setSelectedFlow(id)} />
          </TabsContent>
          <TabsContent value="organismos">
            <TabOrganismos />
          </TabsContent>
          <TabsContent value="guardian">
            <TabGuardian />
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail sheets */}
      <StoreAuditSheet
        storeId={selectedStore}
        open={!!selectedStore}
        onClose={() => setSelectedStore("")}
      />
      <FlowDetailSheet
        flowId={selectedFlow}
        open={!!selectedFlow}
        onClose={() => setSelectedFlow("")}
      />
    </div>
  );
};

export default Manager;
