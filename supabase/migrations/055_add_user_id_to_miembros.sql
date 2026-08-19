-- Agregar columna user_id para vincular miembro con cuenta de Auth
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_miembros_user_id ON public.miembros(user_id);
