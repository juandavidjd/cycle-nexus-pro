-- PROPUESTA — NO aplicar directamente a Supabase Cloud.
-- Requiere: smoke test + firma humana arquitecto.
-- Propuesto: PC II V3 · Ciclo 2 · 2026-06-20
--
-- Objetivo: agregar srm_role a tabla profiles + política RLS + función assign_srm_role.
-- Estrategia: toda cuenta nueva recibe srm_guest por defecto.
--             El admin asigna roles superiores via assign_srm_role() o Supabase Dashboard.

-- 1. Agregar columna role al perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS srm_role TEXT
    NOT NULL DEFAULT 'srm_guest'
    CHECK (srm_role IN (
      'srm_admin',
      'srm_client_admin',
      'srm_catalog_chief',
      'srm_seller',
      'srm_technician',
      'srm_guest'
    ));

-- 2. Política RLS: usuario puede ver su propio rol (ya cubierto por SELECT policy existente)
-- Nota: la política "Users can view their own profile" ya cubre srm_role (SELECT *)

-- 3. Política: usuario NO puede auto-asignarse un rol superior
-- (UPDATE existente solo permite self-update; no agrega lógica de restricción de rol)
-- Para mayor seguridad, bloquear UPDATE en srm_role para el propio usuario:
CREATE POLICY "Users cannot self-escalate role"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  srm_role = (SELECT srm_role FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. Función para que el admin asigne rol via RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.assign_srm_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_role NOT IN (
    'srm_admin','srm_client_admin','srm_catalog_chief',
    'srm_seller','srm_technician','srm_guest'
  ) THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  UPDATE public.profiles
    SET srm_role = new_role, updated_at = now()
    WHERE user_id = target_user_id;

  -- Propagar a app_metadata para que el JWT incluya el rol
  -- (requiere SERVICE_ROLE key — ejecutar desde admin Supabase o Edge Function con service key)
  -- NOTA: UPDATE auth.users.raw_app_meta_data no es posible desde SQL plano sin service_role.
  -- Implementar via Edge Function admin: supabaseAdmin.auth.admin.updateUserById(id, { app_metadata: { srm_role } })
END;
$$;

-- 5. Propagación a JWT app_metadata (PENDIENTE — requiere Edge Function con service_role key)
-- La función assign_srm_role actualiza profiles.srm_role pero NO actualiza app_metadata del JWT.
-- Para que useOdiRole() lea el rol del JWT (session.user.app_metadata.srm_role),
-- se necesita una Edge Function admin que llame:
--   supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { srm_role: newRole } })
-- Esta es la frontera humana: requiere activación manual o Edge Function separada.

-- ESTADO: PROPOSAL · no aplicado · gates_enabled=false
-- PRÓXIMO PASO: arquitecto firma + aplica + activa VITE_AUTH_GATES_ENABLED=true
