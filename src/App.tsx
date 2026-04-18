import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SkinProvider } from "@/context/SkinProvider";

const queryClient = new QueryClient();

const IS_HABITAT = typeof window !== "undefined" &&
  (window.location.hostname.replace(/^www\./, "") === "liveodi.com" || window.location.hostname === "localhost");

// Lazy load
const LiveODI = lazy(() => import("./components/LiveODI"));
const AgentPage = lazy(() => import("./pages/AgentHabitat"));
const StoreLanding = lazy(() => import("./pages/StoreLanding"));

// SRM wrapper — loads auth + providers only when needed
const SRMApp = lazy(() => import("./SRMApp"));

const Loading = () => (
  <div style={{ minHeight: "100vh", background: "#020509", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle, #3db8ff44 0%, transparent 70%)", animation: "pulse 2s infinite" }} />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <SkinProvider>
        <Suspense fallback={<Loading />}>
          {IS_HABITAT ? (
            <Routes>
              <Route path="/manager" element={<AgentPage />} />
              <Route path="/panel" element={<AgentPage />} />
              <Route path="/tienda/:storeCode" element={<StoreLanding />} />
              <Route path="*" element={<LiveODI />} />
            </Routes>
          ) : (
            <SRMApp />
          )}
        </Suspense>
      </SkinProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
