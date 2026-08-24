-- MIGRACIÓN 058: Eliminar miembros y discipuladores incluyendo auth.users

-- 1. Función para eliminar un miembro (y su auth user)
CREATE OR REPLACE FUNCTION public.eliminar_miembro(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Obtener el user_id antes de borrar
  SELECT user_id INTO v_user_id FROM public.miembros WHERE id = p_id;

  -- Limpiar referencias antes de borrar el miembro
  IF v_user_id IS NOT NULL THEN
    UPDATE public.miembros SET user_id = NULL WHERE user_id = v_user_id AND id != p_id;
  END IF;

  -- Borrar miembro (cascades: agenda, oraciones, tareas, timeline, asistencia, seguimientos, estudios_biblicos)
  DELETE FROM public.miembros WHERE id = p_id;

  -- Borrar profile (puede estar vinculado por user_id o ser el mismo id)
  DELETE FROM public.profiles WHERE id = p_id OR (v_user_id IS NOT NULL AND id = v_user_id);

  -- Borrar auth user
  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
  -- Si el miembro.id era también un auth user (registro directo)
  DELETE FROM auth.users WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.eliminar_miembro(p_id uuid) TO authenticated;

-- 2. Función para eliminar discipuladores (y sus auth users)
CREATE OR REPLACE FUNCTION public.eliminar_discipuladores(p_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpiar seguimientos
  DELETE FROM public.seguimientos WHERE discipulador_id = ANY(p_ids);
  -- Limpiar referencias en otras tablas
  UPDATE public.miembros SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.agenda SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.oraciones SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.tareas SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  -- Borrar profiles
  DELETE FROM public.profiles WHERE id = ANY(p_ids) AND rol = 'discipulador';
  -- Borrar auth users
  DELETE FROM auth.users WHERE id = ANY(p_ids);
END;
$$;
GRANT EXECUTE ON FUNCTION public.eliminar_discipuladores(p_ids uuid[]) TO authenticated;
