-- Permitir ensure_miembro para cualquier rol (admin, discipulador, miembro)
CREATE OR REPLACE FUNCTION public.ensure_miembro() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_rol text; v_profile record; v_miembro_id uuid;
BEGIN
  SELECT rol INTO v_rol FROM public.profiles WHERE id = v_user_id;
  IF v_rol IS NULL THEN RAISE EXCEPTION 'No se encontró tu perfil de usuario'; END IF;
  SELECT id INTO v_miembro_id FROM public.miembros WHERE user_id = v_user_id LIMIT 1;
  IF v_miembro_id IS NOT NULL THEN RETURN v_miembro_id; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  INSERT INTO public.miembros (lider_id, user_id, nombre, apellido, email, fecha_nacimiento, telefono, etapa_id, estado) VALUES (v_user_id, v_user_id, COALESCE(v_profile.nombre, ''), COALESCE(v_profile.apellido, ''), v_profile.email, v_profile.fecha_nacimiento, v_profile.telefono, 1, 'activo') ON CONFLICT (user_id) DO NOTHING RETURNING id INTO v_miembro_id;
  IF v_miembro_id IS NULL THEN SELECT id INTO v_miembro_id FROM public.miembros WHERE user_id = v_user_id LIMIT 1; END IF;
  IF v_miembro_id IS NOT NULL THEN INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado) SELECT v_miembro_id, v_user_id, 1, 0, 'activo' WHERE NOT EXISTS (SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_id AND estado = 'activo'); END IF;
  RETURN v_miembro_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_miembro() TO authenticated;
