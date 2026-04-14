import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// ─── SRM Pages ───
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
import LiveODI from "./components/LiveODI";

const queryClient = new QueryClient();

// ─── Detect: is this liveodi.com? ───
const IS_HABITAT = typeof window !== "undefined" &&
  (window.location.hostname.replace(/^www\./, "") === "liveodi.com" || window.location.hostname === "localhost");

// ─── App ───
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {IS_HABITAT ? (
            <Routes>
              <Route path="/manager" element={<Manager />} />
              <Route path="/panel" element={<AgentPage />} />
              <Route path="*" element={<LiveODI />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/manager" element={<Manager />} />
              <Route path="/panel" element={<AgentPage />} />
              <Route path="/agent" element={<LiveODI />} />
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
          )}
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
