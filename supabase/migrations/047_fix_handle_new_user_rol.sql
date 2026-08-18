CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rol_final user_role := 'discipulo';
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN
    rol_final := 'discipulador';
  END IF;

  INSERT INTO public.profiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
    rol_final
  )
  ON CONFLICT (id) DO UPDATE SET rol = rol_final;

  RETURN NEW;
END;
$$;
