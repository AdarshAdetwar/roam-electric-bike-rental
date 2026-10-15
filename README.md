# Roam — Electric Motorbike Rental

Roam is a React Native (Expo) mobile app backed by a JavaScript/Express REST API and PostgreSQL. It implements the assignment flows: login, password reset, motorbike browsing, one-hour rentals, ride completion and issue reports.

## Prerequisites

- Node.js 20 or newer and npm
- PostgreSQL 13 or newer (for `gen_random_uuid()`)
- Expo Go on a phone, Android Studio emulator, or Xcode/iOS simulator

## Database setup

Create an empty database:

```sql
CREATE DATABASE roam;
```

Apply the schema and sample inventory from the repository root:

```sh
psql -U postgres -d roam -f backend/src/db/schema.sql
psql -U postgres -d roam -f backend/src/db/seed.sql
```

The schema is designed for the application and documented in [docs/database.md](./docs/database.md). It includes partial unique indexes that prevent concurrent active rides for the same rider or motorbike.

If you already installed the previous Roam schema, apply the profile migration once before starting the updated backend:

```powershell
psql -U postgres -d roam -f backend/src/db/migrations/20261015_add_user_full_name.sql
```

## Backend setup

```sh
cd backend
copy .env.example .env
```

On macOS/Linux, replace `copy` with `cp`. Edit `backend/.env` and set `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters. Keep `ASSIGNMENT_MODE=true` for local assignment testing; set it to `false` outside that context.

Install and run:

```sh
npm install
npm run seed:demo-user
npm run dev
```

The API listens on port `3000`. Health check: `GET http://localhost:3000/api/health`.

Demo login:

```text
Email:    demo@roam.app
Password: RoamDemo123!
```

The demo-user script is safe to re-run and resets the dedicated demo account password to the documented value. Users can also create accounts through the app's registration screen.

## Mobile setup

Set the API host in `mobile/.env` (copy `mobile/.env.example`). Use an address reachable from the device:

```text
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

- Android Studio emulator: `http://10.0.2.2:3000/api`
- iOS simulator: `http://localhost:3000/api`
- Physical device: `http://<your-computer-LAN-IP>:3000/api`

Then run:

```sh
cd mobile
npm install
npm start
```

Scan the Expo QR code with Expo Go or launch an emulator from the Expo CLI. The app stores its JWT and basic user object using `expo-secure-store`.

## End-to-end smoke test

1. Start PostgreSQL and the backend; apply the schema and motorbike fleet seed.
2. Run `npm run seed:demo-user` from `backend/` and sign in with the demo credentials.
   Alternatively, choose **Create an account** on the login screen; registration accepts an email or phone number and signs the new user in.
3. Open **Explore**, refresh the catalog, and select an available motorbike. Confirm a one-hour ride.
4. Open **Your ride** to view the server-end-time countdown. Use **Report an issue** and submit a 3–500 character description.
5. Select **End ride**. The motorbike becomes available again, or low-battery if its stored battery value is 20% or below.
6. Test password recovery from the login screen. In assignment mode, the generic forgot-password response includes the reset token only for a registered account. Submit it with a new password and sign in again.
7. To test expiry, reduce an active rental's `ends_at` to a past time in a local test database; the next active-rental check or rental creation marks it expired and updates motorbike availability.
8. Open the **Profile** tab while signed in to view your name, registered contact information, and completed or expired rental history.

## API documentation

See [docs/api.md](./docs/api.md) for endpoint bodies, example responses, status codes, authentication, ownership behavior and the standard error shape.

## Project walkthrough and run instructions

- [Interview and code walkthrough](./docs/interview-guide/PROJECT_WALKTHROUGH.md) explains the architecture, files, application flows, database rules, and common interview questions.
- [Run the application](./docs/interview-guide/RUN_APPLICATION.md) gives setup and startup instructions, including Windows, emulator, and physical-device networking.

## Assumptions and known limitations

- Users can create an account with a name and email or phone number. Registration signs them in automatically; the protected Profile tab shows their account details.
- The demo-user script provisions one local test account and is intended for testing rather than normal registration.
- Reset-token delivery is intentionally omitted; assignment mode returns a token for testing. Disable assignment mode outside local testing.
- A rental lasts exactly one hour. Billing, maps/GPS, payment processing and real-time fleet telemetry are outside the requested scope.
- Expired rentals are reconciled on active-rental reads and when creating a rental. Motorbike battery is not consumed during a ride; battery level is used only when deciding whether the motorbike is available or low-battery after return.
- `hourlyRate` is returned by PostgreSQL as a decimal string; the mobile UI formats it as currency.
