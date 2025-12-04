import { useParams, Navigate } from "react-router-dom";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FooterSRM } from "@/components/FooterSRM";
import { ClientLanding } from "@/components/ClientLanding";
import { Client } from "@/types/client";
import clientsData from "@/data/clients.json";
import { useMemo } from "react";

const ClientPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const clients = clientsData as Client[];

  const client = useMemo(() => {
    return clients.find(c => c.id === clientId);
  }, [clients, clientId]);

  if (!client) {
    return <Navigate to="/catalogo" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />
      <ClientLanding client={client} />
      <FooterSRM />
    </div>
  );
};

export default ClientPage;
