import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SkinProvider, useSkin } from "@/context/SkinProvider";

// ─── SRM Pages (somosrepuestosmotos.com) ───
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import Clientes from "./pages/Clientes";
import ClientPage from "./pages/ClientPage";
import Intelligent from "./pages/Intelligent";
import Academia from "./pages/Academia";
import AcademiaModulo from "./pages/AcademiaModulo";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Manager from "./pages/Manager";
import AgentPage from "./pages/AgentHabitat";
import LiveODIPage from "./pages/LiveODIPage";
import LiveODI from "./components/LiveODI";

// ─── Habitat (liveodi.com) ───
import HabitatLayout from "./components/habitat/HabitatLayout";

const queryClient = new QueryClient();

// ─── Layout Router: hostname → layout ───

function AppContent() {
  const skin = useSkin();

  switch (skin.layout) {
    case "habitat":
      return (
        <Routes>
          <Route path="/panel" element={<AgentPage />} />
          <Route path="*" element={<LiveODI />} />
        </Routes>
      );
    case "srm":
      return <SRMRoutes />;
    default:
      return <LiveODI />;
  }
}

// ─── SRM Routes (cycle-nexus-pro actual) ───

function SRMRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/intelligent" element={<Intelligent />} />
      <Route path="/academia" element={<Academia />} />
      <Route path="/academia/modulo/:id" element={<AcademiaModulo />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/:clientId" element={<ClientPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ─── App Root ───

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SkinProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/manager" element={<Manager />} />
              <Route path="/agent" element={<LiveODIPage />} />
              <Route path="/panel" element={<AgentPage />} />
              <Route path="*" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
        </SkinProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

