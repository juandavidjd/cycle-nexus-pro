import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ROUTE_GATES } from "@/lib/odi-roles";

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
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

export default function SRMApp() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/manager" element={
            <ProtectedRoute requiredRoles={ROUTE_GATES['/manager']}>
              <AgentPage />
            </ProtectedRoute>
          } />
          <Route path="/panel" element={
            <ProtectedRoute requiredRoles={ROUTE_GATES['/manager']}>
              <AgentPage />
            </ProtectedRoute>
          } />
          <Route path="/agent" element={<LiveODI />} />
          <Route path="/" element={<Index />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/intelligent" element={
            <ProtectedRoute requiredRoles={ROUTE_GATES['/intelligent']}>
              <Intelligent />
            </ProtectedRoute>
          } />
          <Route path="/academia" element={<Academia />} />
          <Route path="/academia/modulo/:id" element={<AcademiaModulo />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/:clientId" element={<ClientPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
}
