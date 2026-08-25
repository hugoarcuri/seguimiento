-- MIGRACIÓN 059: Soft delete para miembros y discipuladores

-- 1. Agregar deleted_at a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Soft delete para miembros (en vez de borrar, marcar estado='eliminado')
CREATE OR REPLACE FUNCTION public.eliminar_miembro(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.miembros
  SET estado = 'eliminado', user_id = NULL, lider_id = NULL
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.eliminar_miembro(p_id uuid) TO authenticated;

-- 3. Soft delete para discipuladores (marcar profiles.deleted_at)
CREATE OR REPLACE FUNCTION public.eliminar_discipuladores(p_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seguimientos SET discipulador_id = NULL WHERE discipulador_id = ANY(p_ids);
  UPDATE public.miembros SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.agenda SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.oraciones SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.tareas SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  UPDATE public.profiles SET deleted_at = now() WHERE id = ANY(p_ids) AND rol = 'discipulador';
END;
$$;
GRANT EXECUTE ON FUNCTION public.eliminar_discipuladores(p_ids uuid[]) TO authenticated;

-- 4. handle_new_user: restaurar miembros/discipuladores eliminados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rol_final user_role := 'miembro';
  nuevo_miembro_id uuid;
  v_miembro_existente uuid;
  v_profile_eliminado record;
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN
    rol_final := 'discipulador';
  END IF;

  -- Buscar profile eliminado para restaurar
  SELECT id INTO v_profile_eliminado
  FROM public.profiles
  WHERE email = NEW.email AND deleted_at IS NOT NULL
  LIMIT 1;

  IF v_profile_eliminado IS NOT NULL THEN
    -- Restaurar profile existente
    UPDATE public.profiles
    SET id = NEW.id,
        nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
        apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido),
        rol = rol_final,
        deleted_at = NULL
    WHERE id = v_profile_eliminado.id;

    -- Si era miembro, restaurar el miembro vinculándolo al nuevo user_id
    IF rol_final = 'miembro' THEN
      SELECT id INTO v_miembro_existente
      FROM public.miembros
      WHERE email = NEW.email AND estado = 'eliminado'
      LIMIT 1;

      IF v_miembro_existente IS NOT NULL THEN
        UPDATE public.miembros
        SET user_id = NEW.id, estado = 'activo',
            nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
            apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido)
        WHERE id = v_miembro_existente;

        INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
        SELECT v_miembro_existente, NEW.id, 1, 0, 'activo'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_existente AND estado = 'activo'
        );
      END IF;
    END IF;
  ELSE
    -- No hay profile eliminado: crear normalmente
    INSERT INTO public.profiles (id, email, nombre, apellido, rol)
    VALUES (NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
      COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
      rol_final)
    ON CONFLICT (id) DO UPDATE SET rol = rol_final;

    IF rol_final = 'miembro' THEN
      SELECT id INTO v_miembro_existente
      FROM public.miembros
      WHERE email = NEW.email AND user_id IS NULL AND estado != 'eliminado'
      LIMIT 1;

      IF v_miembro_existente IS NOT NULL THEN
        UPDATE public.miembros
        SET user_id = NEW.id,
            nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
            apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido)
        WHERE id = v_miembro_existente;

        INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
        SELECT v_miembro_existente, NEW.id, 1, 0, 'activo'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_existente AND estado = 'activo'
        );
      ELSE
        INSERT INTO public.miembros (
          lider_id, user_id, nombre, apellido, email, sexo, fecha_nacimiento,
          telefono, direccion, fecha_conversion, bautizado, es_miembro,
          dones, convive_con, estudia, trabaja, etapa_id, estado
        ) VALUES (
          NEW.id, NEW.id,
          COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
          COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
          NEW.email,
          NULLIF(NEW.raw_user_meta_data->> 'sexo', ''),
          NULLIF(NEW.raw_user_meta_data->> 'fecha_nacimiento', '')::date,
          NULLIF(NEW.raw_user_meta_data->> 'telefono', ''),
          NULLIF(NEW.raw_user_meta_data->> 'direccion', ''),
          NULLIF(NEW.raw_user_meta_data->> 'fecha_conversion', '')::date,
          COALESCE((NEW.raw_user_meta_data->> 'bautizado')::boolean, false),
          COALESCE((NEW.raw_user_meta_data->> 'es_miembro')::boolean, false),
          NULLIF(NEW.raw_user_meta_data->> 'don_espiritual', ''),
          NULLIF(NEW.raw_user_meta_data->> 'convive_con', ''),
          NULLIF(NEW.raw_user_meta_data->> 'estudia', ''),
          NULLIF(NEW.raw_user_meta_data->> 'trabaja', ''),
          1, 'activo'
        )
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id INTO nuevo_miembro_id;

        IF nuevo_miembro_id IS NOT NULL THEN
          INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
          VALUES (nuevo_miembro_id, NEW.id, 1, 0, 'activo');
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Restaurar miembro
CREATE OR REPLACE FUNCTION public.restaurar_miembro(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.miembros SET estado = 'activo' WHERE id = p_id AND estado = 'eliminado';
END;
$$;
GRANT EXECUTE ON FUNCTION public.restaurar_miembro(p_id uuid) TO authenticated;

-- 6. Restaurar discipulador
CREATE OR REPLACE FUNCTION public.restaurar_discipulador(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET deleted_at = NULL WHERE id = p_id AND deleted_at IS NOT NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.restaurar_discipulador(p_id uuid) TO authenticated;

-- 7. RLS: ocultar registros eliminados
DROP POLICY IF EXISTS "Admins/líderes pueden ver todos los miembros" ON public.miembros;
CREATE POLICY "Admins/líderes pueden ver todos los miembros" ON public.miembros
  FOR SELECT USING (
    (public.is_admin() OR lider_id = auth.uid()) AND estado != 'eliminado'
  );
