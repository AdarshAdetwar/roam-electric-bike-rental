ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Roam rider';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_full_name_length'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_full_name_length
      CHECK (char_length(full_name) BETWEEN 2 AND 80);
  END IF;
END
$$;
