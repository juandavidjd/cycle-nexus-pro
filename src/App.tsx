import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import Clientes from "./pages/Clientes";
import ClientPage from "./pages/ClientPage";
import Intelligent from "./pages/Intelligent";
import Academia from "./pages/Academia";
import AcademiaModulo from "./pages/AcademiaModulo";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/intelligent" element={<Intelligent />} />
            <Route path="/academia" element={<Academia />} />
            <Route path="/academia/modulo/:id" element={<AcademiaModulo />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/:clientId" element={<ClientPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
