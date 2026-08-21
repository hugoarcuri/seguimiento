-- Safe rename: only renames columns that actually exist
DO $$
DECLARE
  rec record;
BEGIN
  -- Rename table
  ALTER TABLE IF EXISTS public.discipulos RENAME TO miembros;

  -- Rename discipulo_id -> miembro_id in all tables that have it
  FOR rec IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'discipulo_id' AND table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN discipulo_id TO miembro_id', rec.table_name);
  END LOOP;
END $$;

-- Constraints e índices
ALTER TABLE IF EXISTS public.miembros RENAME CONSTRAINT discipulos_user_id_unique TO miembros_user_id_unique;
DROP INDEX IF EXISTS public.idx_discipulos_user_id;
CREATE INDEX IF NOT EXISTS idx_miembros_user_id ON public.miembros(user_id);
DROP TRIGGER IF EXISTS update_discipulos_updated_at ON public.miembros;
CREATE TRIGGER update_miembros_updated_at
  BEFORE UPDATE ON public.miembros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP INDEX IF EXISTS public.seguimientos_discipulo_activo_unique;
CREATE UNIQUE INDEX IF NOT EXISTS seguimientos_miembro_activo_unique
  ON public.seguimientos (miembro_id) WHERE estado = 'activo';

-- RLS tabla miembros
DROP POLICY IF EXISTS "Admins/líderes pueden ver todos los discípulos" ON public.miembros;
DROP POLICY IF EXISTS "Discípulos pueden ver su propio registro" ON public.miembros;
DROP POLICY IF EXISTS "Admins/líderes pueden insertar discípulos" ON public.miembros;
DROP POLICY IF EXISTS "Admins/líderes pueden actualizar discípulos" ON public.miembros;
DROP POLICY IF EXISTS "Admins pueden eliminar discípulos" ON public.miembros;
CREATE POLICY "Admins/líderes pueden ver todos los miembros" ON public.miembros FOR SELECT USING (public.is_admin() OR lider_id = auth.uid());
CREATE POLICY "Miembros pueden ver su propio registro" ON public.miembros FOR SELECT USING (user_id = auth.uid() OR lider_id = auth.uid());
CREATE POLICY "Admins/líderes pueden insertar miembros" ON public.miembros FOR INSERT WITH CHECK (public.is_admin() OR lider_id = auth.uid());
CREATE POLICY "Admins/líderes pueden actualizar miembros" ON public.miembros FOR UPDATE USING (public.is_admin() OR lider_id = auth.uid());
CREATE POLICY "Admins pueden eliminar miembros" ON public.miembros FOR DELETE USING (public.is_admin());

-- RLS otras tablas
DROP POLICY IF EXISTS "Discípulos pueden ver sus encuentros" ON public.encuentros;
CREATE POLICY "Miembros pueden ver sus encuentros" ON public.encuentros FOR SELECT USING (EXISTS (SELECT 1 FROM public.miembros WHERE id = encuentros.miembro_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Discípulos pueden ver sus oraciones" ON public.oraciones;
CREATE POLICY "Miembros pueden ver sus oraciones" ON public.oraciones FOR SELECT USING (EXISTS (SELECT 1 FROM public.miembros WHERE id = oraciones.miembro_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Discípulos pueden ver sus tareas" ON public.tareas;
CREATE POLICY "Miembros pueden ver sus tareas" ON public.tareas FOR SELECT USING (EXISTS (SELECT 1 FROM public.miembros WHERE id = tareas.miembro_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins/líderes gestionan timeline" ON public.timeline;
DROP POLICY IF EXISTS "Discípulos ven su timeline" ON public.timeline;
CREATE POLICY "Admins/líderes gestionan timeline" ON public.timeline FOR ALL USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.miembros WHERE miembros.id = timeline.miembro_id AND miembros.lider_id = auth.uid()));
CREATE POLICY "Miembros ven su timeline" ON public.timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.miembros WHERE miembros.id = timeline.miembro_id AND miembros.user_id = auth.uid()));
DROP POLICY IF EXISTS "Discípulos pueden gestionar su asistencia" ON public.asistencia;
CREATE POLICY "Miembros pueden gestionar su asistencia" ON public.asistencia FOR ALL USING (EXISTS (SELECT 1 FROM public.miembros WHERE id = asistencia.miembro_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Miembros pueden leer sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Miembros pueden insertar sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Miembros pueden eliminar sus personas_oracion" ON public.personas_oracion;
CREATE POLICY "Miembros pueden leer sus personas_oracion" ON public.personas_oracion FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Miembros pueden insertar sus personas_oracion" ON public.personas_oracion FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Miembros pueden eliminar sus personas_oracion" ON public.personas_oracion FOR DELETE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Usuarios pueden ver perfil de su discipulador" ON public.profiles;
CREATE POLICY "Usuarios pueden ver perfil de su miembro líder" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin() OR EXISTS (SELECT 1 FROM public.miembros WHERE miembros.lider_id = profiles.id AND miembros.user_id = auth.uid()));

-- Funciones
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rol_final user_role := 'miembro';
  nuevo_miembro_id uuid;
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN rol_final := 'discipulador'; END IF;
  INSERT INTO public.profiles (id, email, nombre, apellido, rol) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->> 'nombre', ''), COALESCE(NEW.raw_user_meta_data->> 'apellido', ''), rol_final) ON CONFLICT (id) DO UPDATE SET rol = rol_final;
  IF NEW.raw_user_meta_data->> 'registro_miembro' = 'true' AND rol_final = 'miembro' THEN
    INSERT INTO public.miembros (lider_id, user_id, nombre, apellido, email, sexo, fecha_nacimiento, telefono, direccion, fecha_conversion, bautizado, es_miembro, dones, convive_con, estudia, trabaja, etapa_id, estado) VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->> 'nombre', ''), COALESCE(NEW.raw_user_meta_data->> 'apellido', ''), NEW.email, NULLIF(NEW.raw_user_meta_data->> 'sexo', ''), NULLIF(NEW.raw_user_meta_data->> 'fecha_nacimiento', '')::date, NULLIF(NEW.raw_user_meta_data->> 'telefono', ''), NULLIF(NEW.raw_user_meta_data->> 'direccion', ''), NULLIF(NEW.raw_user_meta_data->> 'fecha_conversion', '')::date, COALESCE((NEW.raw_user_meta_data->> 'bautizado')::boolean, false), COALESCE((NEW.raw_user_meta_data->> 'es_miembro')::boolean, false), NULLIF(NEW.raw_user_meta_data->> 'don_espiritual', ''), NULLIF(NEW.raw_user_meta_data->> 'convive_con', ''), NULLIF(NEW.raw_user_meta_data->> 'estudia', ''), NULLIF(NEW.raw_user_meta_data->> 'trabaja', ''), 1, 'activo') ON CONFLICT (user_id) DO NOTHING RETURNING id INTO nuevo_miembro_id;
    IF nuevo_miembro_id IS NOT NULL THEN
      INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado) VALUES (nuevo_miembro_id, NEW.id, 1, 0, 'activo');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_miembro() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_rol text; v_profile record; v_miembro_id uuid;
BEGIN
  SELECT rol INTO v_rol FROM public.profiles WHERE id = v_user_id;
  IF v_rol IS NULL OR v_rol NOT IN ('miembro', 'discipulo') THEN RAISE EXCEPTION 'Solo los miembros pueden usar esta función'; END IF;
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

CREATE OR REPLACE FUNCTION public.admin_sync_miembros() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0; v_profile record; v_miembro_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Solo los administradores pueden usar esta función'; END IF;
  FOR v_profile IN SELECT p.id, p.email, p.nombre, p.apellido, p.fecha_conversion, p.fecha_nacimiento, p.telefono FROM public.profiles p WHERE p.rol IN ('miembro', 'discipulo') AND NOT EXISTS (SELECT 1 FROM public.miembros m WHERE m.user_id = p.id) LOOP
    INSERT INTO public.miembros (lider_id, user_id, nombre, apellido, email, fecha_conversion, fecha_nacimiento, telefono, etapa_id, estado) VALUES (v_profile.id, v_profile.id, COALESCE(v_profile.nombre, ''), COALESCE(v_profile.apellido, ''), v_profile.email, v_profile.fecha_conversion, v_profile.fecha_nacimiento, v_profile.telefono, 1, 'activo') ON CONFLICT (user_id) DO NOTHING RETURNING id INTO v_miembro_id;
    IF v_miembro_id IS NULL THEN SELECT id INTO v_miembro_id FROM public.miembros WHERE user_id = v_profile.id LIMIT 1; END IF;
    IF v_miembro_id IS NOT NULL THEN INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado) SELECT v_miembro_id, v_profile.id, 1, 0, 'activo' WHERE NOT EXISTS (SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_id AND estado = 'activo'); END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_sync_miembros() TO authenticated;

CREATE OR REPLACE FUNCTION public.eliminar_discipuladores(p_ids uuid[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.seguimientos SET discipulador_id = NULL WHERE discipulador_id = ANY(p_ids);
  UPDATE public.miembros SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  DELETE FROM public.profiles WHERE id = ANY(p_ids) AND rol = 'discipulador';
END;
$$;
