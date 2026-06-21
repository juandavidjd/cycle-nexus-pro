// Hook: read srm_role from Supabase session app_metadata
// Propuesto: PC II V3 · Ciclo 2 · 2026-06-20
// El campo app_metadata.srm_role es asignado por admin Supabase (SQL o función).
// Hasta que se aplique la migración, todos los usuarios autenticados reciben DEFAULT_AUTHENTICATED_ROLE.

import { useAuth } from '@/hooks/useAuth';
import { type OdiRole, DEFAULT_AUTHENTICATED_ROLE } from '@/lib/odi-roles';

export function useOdiRole(): OdiRole | null {
  const { session } = useAuth();
  if (!session) return null;

  const fromMeta = session.user?.app_metadata?.srm_role as OdiRole | undefined;
  return fromMeta ?? DEFAULT_AUTHENTICATED_ROLE;
}
