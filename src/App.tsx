import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

// ─── Detect habitat by hostname ───
const IS_HABITAT = typeof window !== "undefined" &&
  (window.location.hostname.replace(/^www\./, "") === "liveodi.com" || window.location.hostname === "localhost");

// ─── Lazy load: only load what's needed ───
const LiveODI = lazy(() => import("./components/LiveODI"));
const AgentPage = lazy(() => import("./pages/AgentHabitat"));
// Manager unified into /panel — redirect /manager to /panel
const Manager = lazy(() => import("./pages/AgentHabitat"));

// SRM pages only loaded if NOT habitat
const Index = lazy(() => import("./pages/Index"));
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClientPage = lazy(() => import("./pages/ClientPage"));
const Intelligent = lazy(() => import("./pages/Intelligent"));
const Academia = lazy(() => import("./pages/Academia"));
const AcademiaModulo = lazy(() => import("./pages/AcademiaModulo"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Loading = () => (
  <div style={{ minHeight: "100vh", background: "#020509", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle, #3db8ff44 0%, transparent 70%)", animation: "pulse 2s infinite" }} />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
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
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
