ALTER TABLE discipulos
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

ALTER TABLE discipulos
  ADD CONSTRAINT discipulos_user_id_unique UNIQUE (user_id);

CREATE INDEX IF NOT EXISTS idx_discipulos_user_id ON discipulos(user_id);
