# Roam: project and code walkthrough

This guide explains the application and its implementation for technical interviews. The precise API contract is in [api.md](../api.md), and database constraints and relationships are in [database.md](../database.md).

## 1. Project summary

Roam is an electric motorbike rental mobile app. A user can register or sign in, browse a sample fleet, start a one-hour rental, see a countdown, end the ride, report an issue, and view their profile and rental history.

The stack has three parts:

- **Mobile client:** React Native with Expo, navigation, and Axios.
- **Backend:** Node.js and Express REST API. It validates requests, authenticates users, applies business rules, and communicates with the database.
- **Database:** PostgreSQL stores users, motorbikes, rentals, password-reset tokens, and issue reports. It also enforces important integrity and concurrency rules.

The client never connects directly to PostgreSQL. A typical request travels from a screen, through a named API wrapper in Axios, to an Express route, optionally through authentication middleware, then to PostgreSQL. The JSON response updates the screen.

## 2. Main user journeys

### Sign-up, sign-in, and session

Registration accepts a name, email or phone identity, and password. The client validates fields for immediate feedback; the server validates again. Passwords are hashed with bcrypt (cost 12). The server returns a signed JWT; the mobile app saves that token and basic user data with Expo SecureStore. The Axios interceptor attaches the token to protected requests. Logout removes the saved session.

### Find and rent a motorbike

Explore loads the fleet and active-rental state. Users filter by category and may rent only an `available` motorbike. The server creates a rental ending one hour later and changes the motorbike status to `in-use` in a transaction. Your Ride renders the returned `endsAt` timestamp as a countdown. The timer is presentation only: backend/database time controls the rental status.

### Complete a ride and report an issue

Ending a ride marks its rental `completed`. The motorbike returns to `available`, unless its battery is 20% or lower, when its status is `low-battery`. A rider can submit a 3–500 character issue description for their own rental. When an active rental is checked after its scheduled end, the API marks it `expired` and updates the motorbike status.

### Password reset and profile

Forgot-password creates a random token for a matching account and stores only its SHA-256 hash with a 20-minute expiry. The response is deliberately generic to avoid disclosing whether an account exists. With `ASSIGNMENT_MODE=true`, the token is returned for local testing; no email/SMS delivery is implemented. The reset endpoint consumes the token and updates the password in one transaction. Profile shows the authenticated user's account details and rental history.

## 3. Repository map

```text
backend/
  src/
    app.js                    Express middleware and route registration
    index.js                  Database check and HTTP server startup
    config/env.js             Environment settings and JWT secret validation
    db/                       PostgreSQL pool, schema, seed, and migration
    middleware/               JWT authentication and common error responses
    routes/                   Auth, profile, asset, rental, and issue endpoints
    services/rentals.js       Shared transactions and rental-expiry logic
mobile/
  App.js                      Root providers and navigation bootstrap
  src/
    components/               Reusable visual components
    context/AuthContext.js    Shared login state and persisted session
    hooks/useApi.js           Shared request/loading/error state
    navigation/               Auth stack and signed-in tab navigation
    screens/                  Login, registration, catalog, ride, profile, etc.
    services/api.js           Axios client and endpoint wrappers
    theme.js                  Shared colors and spacing
docs/
  api.md                      Endpoint contract and examples
  database.md                 Tables, indexes, and constraints
  interview-guide/             This guide and local run guide
```

## 4. Backend files and responsibilities

### Server startup and configuration

- **`backend/src/index.js`** is the process entry point. It checks PostgreSQL with `SELECT 1` before listening, so the service does not report ready when the database is inaccessible.
- **`backend/src/app.js`** creates the Express app, configures CORS and JSON parsing, mounts the public health route and feature routers, then registers not-found and error middleware.
- **`backend/src/config/env.js`** loads `.env`, requires a `JWT_SECRET` of at least 32 characters, and exports port, database URL, token expiry, assignment mode, and CORS settings.
- **`backend/src/db/pool.js`** creates the shared `pg` pool. It uses `DATABASE_URL` when present, otherwise the normal `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` variables.

### Middleware

- **`backend/src/middleware/auth.js`** requires a Bearer JWT on protected routes, verifies its signature and expiry, and puts the user ID from the token subject into `req.user.id`. Handlers use this trusted identity instead of trusting a client-provided owner ID.
- **`backend/src/middleware/errors.js`** provides a consistent JSON error shape, handles unknown endpoints, logs server-side failures, and avoids returning internal error details to clients for HTTP 500 responses.

### Route handlers and shared service

- **`backend/src/routes/auth.js`** handles registration, login, forgot-password, and reset-password. It normalizes email/phone identity, validates inputs, hashes passwords, issues JWTs, and implements one-time reset tokens. Reset uses `BEGIN`/`COMMIT`/`ROLLBACK` so token consumption and password change succeed or fail together.
- **`backend/src/routes/profile.js`** looks up only the authenticated user's profile and returns safe fields, never the password hash.
- **`backend/src/routes/assets.js`** lists and fetches motorbikes. It validates UUID format and uses SQL aliases to return API fields such as `locationText` and `hourlyRate`.
- **`backend/src/routes/rentals.js`** reads active rides and history, starts rentals, and ends rides. Rental-changing operations use transactions; queries are scoped to `req.user.id`.
- **`backend/src/routes/issues.js`** validates rental ID and description length. Its ownership-filtered `INSERT ... SELECT` only inserts when that rental belongs to the signed-in user.
- **`backend/src/services/rentals.js`** provides `withTransaction`, which always releases its database client and rolls back on failure, and `expireRentals`, which reconciles overdue active rentals and returns their bikes to an appropriate status.

### SQL and seed files

- **`backend/src/db/schema.sql`** creates the tables, constraints, indexes, and foreign keys.
- **`backend/src/db/seed.sql`** adds sample City, Pro, and Cargo motorbikes. Its conflict handling makes re-running it safe.
- **`backend/src/db/create-demo-user.js`** provisions or refreshes a local demo account with a bcrypt-hashed password.
- **`backend/src/db/migrations/20261015_add_user_full_name.sql`** adds a name column to an older existing schema; a fresh database should use `schema.sql`.

## 5. Mobile files and responsibilities

### App bootstrap, navigation, and state

- **`mobile/App.js`** installs safe-area and authentication providers, restores the session before showing navigation, and displays a startup loading indicator.
- **`mobile/src/context/AuthContext.js`** owns the shared token, user, and loading state. It restores/saves data in Expo SecureStore and exposes `login`, `register`, and `logout` through `useAuth`.
- **`mobile/src/navigation/AppNavigator.js`** shows the logged-out auth stack or the authenticated Explore/Your Ride/Profile bottom tabs depending on whether a token exists. This is navigation behavior, not a substitute for backend authorization.
- **`mobile/src/services/api.js`** configures Axios with the API base URL, JSON header, and timeout. Its request interceptor attaches the saved token. Named API groups wrap authentication, profile, asset, rental, and issue endpoints.
- **`mobile/src/hooks/useApi.js`** wraps async requests and manages data, loading, error, and success state. It returns successful results and rethrows failures so screens can handle them.

### Screens

- **`LoginScreen.js`** validates identity/password, calls the auth context, and displays server or connection errors.
- **`RegisterScreen.js`** collects name, identity, and matching passwords, validates them, and signs the user in through the auth context.
- **`ForgotPasswordScreen.js`** requests a reset and, in assignment mode, displays the returned test token.
- **`ResetPasswordScreen.js`** submits a token and matching new passwords, then returns to the login stack on success.
- **`CatalogScreen.js`** loads assets and active-rental state when focused, supports refresh and category filters, confirms before rent, then refreshes and navigates to the ride tab.
- **`ActiveRentalScreen.js`** loads the ride on focus, updates the display countdown every second, asks the server to refresh after expiry, confirms ending the ride, and presents the issue-report form.
- **`ProfileScreen.js`** loads profile and completed/expired rental history and exposes sign-out.

### Reusable components and styling

- **`components/FormField.js`** standardizes labels, text inputs, and validation presentation.
- **`components/PrimaryButton.js`** standardizes button variants and loading/disabled behavior.
- **`components/Feedback.js`** renders loading, success, and error messages.
- **`components/MotorbikeCard.js`** renders a fleet card with status, location, battery, price, and a rent action disabled for unavailable bikes.
- **`components/MotorbikeIllustration.js`** renders the motorbike artwork and category color.
- **`theme.js`** centralizes colors and spacing.
- **`mobile/app.json`** configures the Expo app name, orientation, plugins, and native platform properties.

## 6. Database safeguards to discuss

`schema.sql` contains five main tables: `users`, `password_reset_tokens`, `scooters` (the retained internal table name for motorbikes), `rentals`, and `issues`.

- UUID primary and foreign keys connect records.
- Check constraints enforce valid names, identities, battery percentages, positive rates, statuses, and rental end-state consistency.
- A case-insensitive email index and a unique phone index prevent duplicate identities.
- Partial unique indexes enforce at most one active rental per user and per motorbike.
- `SELECT ... FOR UPDATE` locks rows while rental availability is checked and changed.
- Parameterized SQL (`$1`, `$2`, etc.) prevents user values from becoming SQL syntax.
- A composite issue foreign key ties the reported user to the owner of the rental.

## 7. Example: start-rental request

1. The user chooses an available bike and confirms the displayed one-hour price.
2. `CatalogScreen` calls `rentalApi.start(motorbike.id)`.
3. Axios attaches the SecureStore JWT.
4. Express sends `POST /api/rentals` through `requireAuth`, which provides the verified user ID.
5. The route validates the bike UUID and starts a transaction.
6. The backend reconciles expired rentals, checks the rider has no active rental, locks and checks the bike, inserts a one-hour rental, and changes bike status to `in-use`.
7. PostgreSQL's partial unique indexes provide a final concurrency safeguard if two requests race.
8. The transaction commits. The mobile screen reloads active state and opens Your Ride.

This shows the separation: the client handles interaction, the API enforces authentication and business rules, and the database protects durable invariants.

## 8. Interview questions and answer examples

**What does the application do?**
> It is a full-stack motorbike rental app. The Expo mobile client supports account access, fleet browsing, one-hour rentals, ride countdown/end, issue reports, and profile/history. An Express API validates and authorizes requests, and PostgreSQL stores the authoritative state.

**Why not connect the mobile app directly to PostgreSQL?**
> The backend keeps database credentials off the device and centralizes validation, authorization, and business rules. It also prevents users from changing another rider's data by submitting someone else's ID.

**How are passwords and authentication handled?**
> Passwords are bcrypt-hashed, not stored in plaintext. Successful login returns a signed JWT whose subject identifies the user. The app stores it in SecureStore and sends it with protected requests; backend middleware verifies it.

**How do you prevent double-booking?**
> The API uses a transaction and row locks while checking and changing the bike and rental. Partial unique indexes independently enforce one active rental per rider and bike, so concurrent requests cannot both persist successfully.

**What happens when the countdown reaches zero?**
> The countdown is a display calculated from `endsAt`. The backend reconciles overdue rides on active-rental reads, history reads, or rental creation, and PostgreSQL time determines when a ride is expired.

**How do you secure issue reports?**
> The insert selects only a rental owned by the user in the verified JWT, and a composite foreign key also enforces the rental/user relationship in PostgreSQL.

**What would you improve next?**
> I would add automated API and mobile tests, production email/SMS delivery for reset tokens, rate limiting and monitoring, and production deployment settings. Payments, GPS, and real fleet telemetry would depend on product scope.

## 9. Known scope and limitations

- One-hour rentals only; no payment, billing, maps/GPS, or real-time fleet telemetry.
- The fleet is demo data. Battery level does not drain during a rental.
- Password-reset delivery is omitted. Assignment mode returns tokens for testing and must not be enabled in production.
- Expiration is reconciled on selected API requests rather than by a background worker.
- The backend package does not currently define an automated test script; validate the app using the smoke-test steps in the root README.

## References

- [Run the application on Windows](./RUN_APPLICATION.md)
- [API reference](../api.md)
- [Database guide](../database.md)
