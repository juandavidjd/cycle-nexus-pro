// ProtectedRoute — gate de autenticación + roles ODI
// Propuesto: PC II V3 · Ciclo 2 · 2026-06-20
//
// ESTADO: GATES_ENABLED = false (bypass activo)
// Para activar enforcement: VITE_AUTH_GATES_ENABLED=true + smoke test + firma humana.
// Sin el flag, las rutas se comportan igual que antes (paso transparente).

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { type OdiRole, roleCanAccess } from '@/lib/odi-roles';

const GATES_ENABLED = import.meta.env.VITE_AUTH_GATES_ENABLED === 'true';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: OdiRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading, odiRole } = useAuth();
  const location = useLocation();

  // Bypass: gates desactivados → paso transparente, no rompe login
  if (!GATES_ENABLED) return <>{children}</>;

  if (loading) return null;

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRoles && odiRole !== null && !roleCanAccess(odiRole, requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
