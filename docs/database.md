# Roam database

Roam uses PostgreSQL with UUID primary keys and `TIMESTAMPTZ` timestamps. Run `backend/src/db/schema.sql` once to create the schema, then `backend/src/db/seed.sql` to add the sample electric motorbike fleet. Both SQL files are safe to re-run.

The database retains the internal `scooters` and `scooter_id` identifiers; the API and mobile app present these rentable assets as electric motorbikes.

## Tables

### `users`

Stores an account's full name, optional email and/or phone number, and bcrypt password hash. At least one identity is required. Case-insensitive email and canonical phone values are each unique. Phone numbers are stored as digits with an optional leading `+`; the API accepts spaces, dashes and parentheses and normalizes these before storage and lookup. Full names are constrained to 2–80 characters.

### Existing database migration

If the earlier Roam schema is already installed, apply `backend/src/db/migrations/20261015_add_user_full_name.sql` once before restarting the updated API. It adds the profile name column to existing accounts using the safe placeholder `Roam rider`; users created after the migration provide their own name during registration. The migration is safe to re-run.

### `password_reset_tokens`

Stores only a SHA-256 hash of each reset token, its owner, expiry, optional `used_at`, and creation time. The API issues 256-bit random tokens that expire after 20 minutes. The raw token is returned only when `ASSIGNMENT_MODE=true`. On reset, token consumption and the password update happen in one transaction.

### `scooters`

Stores the motorbike catalog fields: name, category, location text, battery percentage, hourly rental rate and status. Motorbike names are unique fleet labels. Status is constrained to `available`, `low-battery` or `in-use`. Battery is constrained to 0–100 and the positive numeric rate is stored with two decimal places. A composite status/location index supports fleet browsing.

### `rentals`

Associates one user with one motorbike and records `starts_at`, scheduled `ends_at`, actual `ended_at` and `status`. Status is `active`, `completed` or `expired`. A partial unique index allows at most one active rental per user and another allows at most one active rental per motorbike. These database constraints protect against concurrent requests in addition to the service's transactions and row locks.

Expired active rentals are changed to `expired` when rental availability is checked or a new ride is started. The scheduled end time is copied to `ended_at`; the motorbike is then marked `available`, or `low-battery` when its battery is 20% or lower. Ending a ride marks it completed and applies the same motorbike-status rule.

### `issues`

Stores a short description linked to both the rental and reporting user. A composite foreign key guarantees that the issue's user is the owner of its rental; the API also inserts via an ownership-filtered query. Foreign keys restrict deletion of referenced rentals.

## Relationships

```text
users 1 ── * password_reset_tokens
users 1 ── * rentals
motorbikes (stored in `scooters`) 1 ── * rentals
rentals 1 ── * issues
users 1 ── * issues
```

## Constraints and indexes

- Primary and foreign keys use UUIDs; `gen_random_uuid()` is available in supported PostgreSQL releases.
- Account name/identity, motorbike battery/rate/status, rental time/status/end-state, and issue description length are constrained in PostgreSQL.
- Partial unique indexes enforce active-rental exclusivity even when multiple API requests race.
- Indexes support case-insensitive identity lookup, reset-token user/expiry lookup, motorbike status/location browsing, active-rental expiry, rental history by user, and issue lookup by rental.
- SQL uses PostgreSQL parameters (`$1`, `$2`, …); user values are never interpolated into SQL statements.
