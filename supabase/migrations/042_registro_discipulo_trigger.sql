-- Agregar columnas de estudio y trabajo
ALTER TABLE discipulos
  ADD COLUMN IF NOT EXISTS estudia text,
  ADD COLUMN IF NOT EXISTS trabaja text;

-- Trigger: auto-crear discípulo al registrarse desde el formulario público
CREATE OR REPLACE FUNCTION public.handle_new_discipulo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'registro_discipulo' = 'true' THEN
    INSERT INTO public.discipulos (id, nombre, apellido, email, sexo, fecha_nacimiento, telefono, direccion, convive_con, fecha_conversion, bautizado, es_miembro, dones, estudia, trabaja, etapa_id, estado)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
      COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
      NEW.email,
      NULLIF(NEW.raw_user_meta_data->>'sexo', ''),
      NULLIF(NEW.raw_user_meta_data->>'fecha_nacimiento', ''),
      NULLIF(NEW.raw_user_meta_data->>'telefono', ''),
      NULLIF(NEW.raw_user_meta_data->>'direccion', ''),
      NULLIF(NEW.raw_user_meta_data->>'convive_con', ''),
      NULLIF(NEW.raw_user_meta_data->>'fecha_conversion', ''),
      COALESCE((NEW.raw_user_meta_data->>'bautizado')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'es_miembro')::boolean, false),
      NULLIF(NEW.raw_user_meta_data->>'don_espiritual', ''),
      NULLIF(NEW.raw_user_meta_data->>'estudia', ''),
      NULLIF(NEW.raw_user_meta_data->>'trabaja', ''),
      1,
      'activo'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_discipulo ON auth.users;

CREATE TRIGGER on_auth_user_created_discipulo
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_discipulo();
