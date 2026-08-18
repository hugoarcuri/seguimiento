CREATE OR REPLACE FUNCTION public.handle_new_discipulo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'registro_discipulo' = 'true' THEN
    INSERT INTO public.discipulos (id, user_id, nombre, apellido, email, sexo, fecha_nacimiento, telefono, direccion, convive_con, fecha_conversion, bautizado, es_miembro, dones, estudia, trabaja, etapa_id, estado)
    VALUES (
      NEW.id,
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
    ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;
  END IF;
  RETURN NEW;
END;
$$;
