# Roam — Electric Motorbike Rental

Roam is a React Native (Expo) mobile app backed by a JavaScript/Express REST API and PostgreSQL. It implements the assignment flows: login, password reset, motorbike browsing, one-hour rentals, ride completion and issue reports.

## Prerequisites

- Node.js 20 or newer and npm
- PostgreSQL 13 or newer (for `gen_random_uuid()`)
- Expo Go on a phone, Android Studio emulator, or Xcode/iOS simulator

## Database setup

Start PostgreSQL, then open a terminal at the project root. Choose the instructions for your operating system. The commands below assume the PostgreSQL role is named `postgres`; if you use another role, replace `postgres` in the commands and use that role in `DATABASE_URL` below.

### Windows (PowerShell)

Locate the PostgreSQL command-line client. PostgreSQL may not be on `PATH`; this searches the standard Windows installation locations and uses the installed version it finds:

```powershell
$psql = Get-ChildItem "C:\Program Files\PostgreSQL","C:\Program Files (x86)\PostgreSQL" -Filter psql.exe -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notlike "*pgAdmin 4*" } |
  Select-Object -First 1 -ExpandProperty FullName
$psql
& $psql --version
```

Keep using this same PowerShell window for the remaining database commands because `$psql` is a session variable. If the search returns nothing, install PostgreSQL command-line tools, add their `bin` directory to `PATH`, or use SQL Shell/pgAdmin. If PostgreSQL is installed in a nonstandard directory, find `psql.exe` there and set `$psql` to its full path.

Check whether `roam` already exists:

```powershell
& $psql -U postgres -l
```

If `roam` is not listed, create it:

```powershell
& $psql -U postgres -c "CREATE DATABASE roam;"
```

If `roam` is already listed, skip the create command. Enter the PostgreSQL password when prompted. From the project root, apply the schema and sample motorbike inventory:

```powershell
& $psql -U postgres -d roam -f ".\backend\src\db\schema.sql"
& $psql -U postgres -d roam -f ".\backend\src\db\seed.sql"
```

Both SQL files are safe to re-run. Confirm setup by checking the tables and sample motorbike count:

```powershell
& $psql -U postgres -d roam -P pager=off -c "\dt"
& $psql -U postgres -d roam -P pager=off -c "SELECT count(*) AS motorbike_count FROM scooters;"
```

### macOS/Linux (Terminal)

Make sure PostgreSQL command-line tools are installed and `psql` is on `PATH`. From the project root, check the client and list databases:

```sh
psql --version
psql -U postgres -l
```

If `roam` is not listed, create it; otherwise skip this command:

```sh
psql -U postgres -c "CREATE DATABASE roam;"
```

Apply the schema and sample fleet, then verify the tables and seed data:

```sh
psql -U postgres -d roam -f backend/src/db/schema.sql
psql -U postgres -d roam -f backend/src/db/seed.sql
psql -U postgres -d roam -c "\dt"
psql -U postgres -d roam -c "SELECT count(*) AS motorbike_count FROM scooters;"
```

On macOS, PostgreSQL can be installed with a package manager such as Homebrew; on Linux, use the distribution's PostgreSQL packages. If `psql` is not found, install the PostgreSQL client tools or add their install directory to `PATH`.

The schema is designed for the application and documented in [docs/database.md](./docs/database.md). It includes partial unique indexes that prevent concurrent active rides for the same rider or motorbike.

**Fresh database:** Run `schema.sql` and `seed.sql` as shown above. Do **not** run the migration below; `schema.sql` already creates the `full_name` column.

**Existing database from an older version of Roam:** If its `users` table does not have a `full_name` column, apply this migration once before starting the updated backend. If the column already exists, do not run it:

```powershell
& $psql -U postgres -d roam -f ".\backend\src\db\migrations\20261015_add_user_full_name.sql"
```

On macOS/Linux, run the migration from the project root with:

```sh
psql -U postgres -d roam -f backend/src/db/migrations/20261015_add_user_full_name.sql
```

## Backend setup

Open a terminal at the project root. On Windows PowerShell, create the backend environment file with:

```powershell
Set-Location .\backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

On macOS/Linux, use:

```sh
cd backend
cp -n .env.example .env
```

Edit `backend/.env`. Set `DATABASE_URL` to your local PostgreSQL connection string (for example, `postgresql://postgres:YOUR_PASSWORD@localhost:5432/roam`) and replace `JWT_SECRET` with a random secret of at least 32 characters. URL-encode special characters in the password if needed. Keep `ASSIGNMENT_MODE=true` for local assignment testing; set it to `false` outside that context. Do not commit `.env` files or real secrets.

Install dependencies and create the demo account from the `backend` directory:

```powershell
npm install
npm run seed:demo-user
```

These npm commands are the same in macOS/Linux. Then start the API and leave this terminal open:

```powershell
npm run dev
```

Keep this terminal open. The API listens on port `3000`; verify it by opening `http://localhost:3000/api/health` in a browser. The response should be `{"status":"ok"}`.

Demo login:

```text
Email:    demo@roam.app
Password: RoamDemo123!
```

The demo-user script is safe to re-run and resets the dedicated demo account password to the documented value. Users can also create accounts through the app's registration screen.

## Mobile setup

Open a **second terminal** at the project root. On Windows PowerShell, copy the mobile environment template:

```powershell
Set-Location .\mobile
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

On macOS/Linux, use:

```sh
cd mobile
cp -n .env.example .env
```

Edit `mobile\.env` and set `EXPO_PUBLIC_API_URL` to an address reachable from where the app is running:

```text
# Android Studio emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# For iOS simulator or a mobile app running on the same computer:
# EXPO_PUBLIC_API_URL=http://localhost:3000/api

# For a physical phone, use your computer's LAN IP instead:
# EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:3000/api
```

Install dependencies and start Metro from the `mobile` directory:

```sh
npm install
npm start
```

Keep the Metro terminal open while using the app. These commands assume the backend is already running in the first terminal.

### Run on an Android emulator

1. Install Android Studio, create an Android Virtual Device (AVD) in **Device Manager**, and start the emulator.
2. Set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api` in `mobile\.env`. `10.0.2.2` lets the Android emulator reach the API on your computer.
3. In the Metro terminal, wait for Expo to finish starting, then press **a** to open the app in the running emulator. Alternatively, open a third terminal at the project root and run:

   ```sh
   cd mobile
   npm run android
   ```

### Run on a physical phone

Set `EXPO_PUBLIC_API_URL` to `http://<your-computer-LAN-IP>:3000/api`, keep the phone and computer on the same Wi-Fi, then scan the QR code shown by Metro using Expo Go. Do not use `localhost` for the API URL on a phone: it refers to the phone itself. Allow Node.js through Windows Firewall if the phone cannot connect.

The iOS simulator requires macOS and Xcode, so it is not available on Windows. The app stores its JWT and basic user object using `expo-secure-store`.

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

## Assumptions and known limitations

- Users can create an account with a name and email or phone number. Registration signs them in automatically; the protected Profile tab shows their account details.
- The demo-user script provisions one local test account and is intended for testing rather than normal registration.
- Reset-token delivery is intentionally omitted; assignment mode returns a token for testing. Disable assignment mode outside local testing.
- A rental lasts exactly one hour. Billing, maps/GPS, payment processing and real-time fleet telemetry are outside the requested scope.
- Expired rentals are reconciled on active-rental reads and when creating a rental. Motorbike battery is not consumed during a ride; battery level is used only when deciding whether the motorbike is available or low-battery after return.
- `hourlyRate` is returned by PostgreSQL as a decimal string; the mobile UI formats it as currency.
