ALTER TABLE discipulos
  ADD COLUMN IF NOT EXISTS estudia boolean,
  ADD COLUMN IF NOT EXISTS trabaja text;
