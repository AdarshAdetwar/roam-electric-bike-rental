CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL DEFAULT 'Roam rider',
  email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_full_name_length CHECK (char_length(full_name) BETWEEN 2 AND 80),
  CONSTRAINT users_identity_required CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CONSTRAINT users_email_format CHECK (email IS NULL OR email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  CONSTRAINT users_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{7,15}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
  ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_created_idx
  ON password_reset_tokens (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx
  ON password_reset_tokens (expires_at) WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS scooters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location_text TEXT NOT NULL,
  battery_percentage SMALLINT NOT NULL,
  hourly_rate NUMERIC(8, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scooters_name_unique UNIQUE (name),
  CONSTRAINT scooters_battery_range CHECK (battery_percentage BETWEEN 0 AND 100),
  CONSTRAINT scooters_rate_positive CHECK (hourly_rate > 0),
  CONSTRAINT scooters_status_valid CHECK (status IN ('available', 'low-battery', 'in-use'))
);
CREATE INDEX IF NOT EXISTS scooters_status_location_idx
  ON scooters (status, location_text);

CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scooter_id UUID NOT NULL REFERENCES scooters(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rentals_time_order CHECK (ends_at > starts_at),
  CONSTRAINT rentals_status_valid CHECK (status IN ('active', 'completed', 'expired')),
  CONSTRAINT rentals_id_user_unique UNIQUE (id, user_id),
  CONSTRAINT rentals_end_consistency CHECK (
    (status = 'active' AND ended_at IS NULL) OR
    (status IN ('completed', 'expired') AND ended_at IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS rentals_one_active_per_user
  ON rentals (user_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS rentals_one_active_per_scooter
  ON rentals (scooter_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS rentals_user_created_idx
  ON rentals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rentals_active_expiry_idx
  ON rentals (ends_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT issues_description_length CHECK (char_length(description) BETWEEN 3 AND 500),
  CONSTRAINT issues_rental_owner_fk FOREIGN KEY (rental_id, user_id)
    REFERENCES rentals(id, user_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS issues_rental_created_idx
  ON issues (rental_id, created_at DESC);
