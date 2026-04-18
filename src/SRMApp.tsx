import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

const LiveODI = lazy(() => import("./components/LiveODI"));
const AgentPage = lazy(() => import("./pages/AgentHabitat"));
const Index = lazy(() => import("./pages/Index"));
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClientPage = lazy(() => import("./pages/ClientPage"));
const Intelligent = lazy(() => import("./pages/Intelligent"));
const Academia = lazy(() => import("./pages/Academia"));
const AcademiaModulo = lazy(() => import("./pages/AcademiaModulo"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function SRMApp() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/manager" element={<AgentPage />} />
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
      </TooltipProvider>
    </AuthProvider>
  );
}
