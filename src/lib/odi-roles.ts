// ODI SRM — Role definitions and permission gates
// Propuesto: PC II V3 · Ciclo 2 · 2026-06-20
// Enforcement OFF por defecto (VITE_AUTH_GATES_ENABLED !== 'true').
// Para activar en producción: firma humana + smoke test requeridos.

export type OdiRole =
  | 'srm_admin'
  | 'srm_client_admin'
  | 'srm_catalog_chief'
  | 'srm_seller'
  | 'srm_technician'
  | 'srm_guest';

export const ROLE_LABELS: Record<OdiRole, string> = {
  srm_admin:         'Admin SRM',
  srm_client_admin:  'Admin Cliente',
  srm_catalog_chief: 'Jefe de Catálogo',
  srm_seller:        'Vendedor',
  srm_technician:    'Técnico de Taller',
  srm_guest:         'Invitado',
};

// Roles ordered by privilege (highest first)
export const ROLE_HIERARCHY: OdiRole[] = [
  'srm_admin',
  'srm_client_admin',
  'srm_catalog_chief',
  'srm_seller',
  'srm_technician',
  'srm_guest',
];

// Route gates — which roles may access each protected route
export const ROUTE_GATES: Record<string, OdiRole[]> = {
  '/intelligent': [
    'srm_admin', 'srm_client_admin', 'srm_catalog_chief',
    'srm_seller', 'srm_technician', 'srm_guest',
  ],
  '/manager': ['srm_admin', 'srm_client_admin'],
  '/panel':   ['srm_admin', 'srm_client_admin'],
};

// Backend endpoint gates
export const UPLOAD_GATE: OdiRole[] = ['srm_admin', 'srm_catalog_chief'];
export const MANAGER_API_GATE: OdiRole[] = ['srm_admin', 'srm_client_admin'];

export function roleCanAccess(role: OdiRole | null, allowedRoles: OdiRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

// Fallback role for authenticated users without explicit app_metadata.srm_role
export const DEFAULT_AUTHENTICATED_ROLE: OdiRole = 'srm_guest';
