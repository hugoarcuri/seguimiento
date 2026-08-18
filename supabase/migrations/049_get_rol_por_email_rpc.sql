-- RPC público: devuelve el rol de un usuario a partir de su email.
-- Se usa en el login para mostrar el badge de rol antes de autenticar.
CREATE OR REPLACE FUNCTION public.get_rol_por_email(p_email text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

-- Permite que usuarios anónimos (no autenticados) lo llamen
GRANT EXECUTE ON FUNCTION public.get_rol_por_email(text) TO anon;
