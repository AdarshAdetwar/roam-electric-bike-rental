# Run the Roam application (Windows)

Follow this guide to run PostgreSQL, the Express API, and the Expo mobile app. Keep PostgreSQL running and use separate PowerShell windows for the backend and Expo. See the [project walkthrough](./PROJECT_WALKTHROUGH.md) for code and feature explanations.

## Requirements

- Windows 10/11, Node.js 20 or newer, and npm.
- PostgreSQL 13 or newer and `psql` available in PowerShell.
- Expo Go on a phone, or Android Studio with an Android emulator. iOS Simulator requires macOS/Xcode.

Check tool availability:

```powershell
node --version
npm --version
psql --version
```

## 1. Create and initialize the database

Start the PostgreSQL Windows service, then from the project root create the database (skip this if it already exists):

```powershell
psql -U postgres -c "CREATE DATABASE roam;"
```

Apply schema and sample inventory:

```powershell
psql -U postgres -d roam -f backend\src\db\schema.sql
psql -U postgres -d roam -f backend\src\db\seed.sql
```

Both SQL files are designed to be safely re-run. For an older existing Roam database that lacks the `full_name` column, apply this migration once:

```powershell
psql -U postgres -d roam -f backend\src\db\migrations\20261015_add_user_full_name.sql
```

## 2. Configure and run the backend

In a PowerShell window at the project root:

```powershell
Set-Location .\backend
if (-not (Test-Path .\.env)) { Copy-Item .\.env.example .\.env }
```

Edit `backend\.env`:

- Set `DATABASE_URL` to your local `roam` PostgreSQL connection, e.g. `postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/roam`. URL-encode special characters in the password.
- Replace `JWT_SECRET` with a private random value of at least 32 characters.
- Keep `PORT=3000` unless you need a different port.
- Keep `ASSIGNMENT_MODE=true` only for local testing; it exposes reset tokens in responses. Set it to `false` outside local assignment testing.
- `CORS_ORIGIN=*` is for local development; restrict it for deployment.

Install and start:

```powershell
npm install
npm run dev
```

`npm run dev` starts Node watch mode. Use `npm start` for a normal start. The API checks the database connection before listening. In another PowerShell window, verify:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Expected response: `status` is `ok`.

### Optional demo account

From the backend folder, provision the local demo account:

```powershell
npm run seed:demo-user
```

Credentials: `demo@roam.app` / `RoamDemo123!`. Use for local testing only; registration through the app is also supported.

## 3. Configure and run the mobile app

In a second PowerShell window at the project root:

```powershell
Set-Location .\mobile
if (-not (Test-Path .\.env)) { Copy-Item .\.env.example .\.env }
```

Set `EXPO_PUBLIC_API_URL` in `mobile\.env` to the backend address reachable from the device:

| Runtime | API URL |
|---|---|
| Android Studio emulator | `http://10.0.2.2:3000/api` |
| iOS simulator (macOS only) | `http://localhost:3000/api` |
| Physical phone on the same Wi-Fi | `http://<COMPUTER-LAN-IP>:3000/api` |
| Web/desktop on the same computer | `http://localhost:3000/api` |

For a phone, use the computer's active Wi-Fi IPv4 address from `ipconfig`; `localhost` on a phone means the phone, not the computer. Make sure both devices share the network and Windows Firewall permits Node.js or TCP port 3000 on the private network.

Install and launch Expo:

```powershell
npm install
npm start
```

Scan the QR code with Expo Go, or use an Android emulator. If LAN delivery of the Expo bundle fails, try `npx expo start --tunnel`; this does not itself expose the API, so `EXPO_PUBLIC_API_URL` must still point to a reachable API host. Restart Expo after changing `.env`.

## 4. Smoke test

1. Confirm PostgreSQL, the API health check, and Expo are running.
2. Register in the app or sign in with the local demo account.
3. In Explore, select an available motorbike and confirm the one-hour rental.
4. In Your Ride, verify the countdown, submit a 3–500 character issue report, and end the ride.
5. Verify the bike becomes available again, or remains low-battery if battery is at most 20%.
6. In Profile, check account details and rental history; sign out.
7. To test password reset, request it for a registered identity. In assignment mode, use the displayed reset token.

## Troubleshooting

- **API will not start:** confirm PostgreSQL is running; check database name, credentials, schema, and 32-character JWT secret.
- **Mobile cannot reach API:** first check the health endpoint on the computer; verify the device-specific URL, LAN address, Wi-Fi, and Windows Firewall. Restart Expo after editing its `.env`.
- **Catalog is empty:** re-run the `seed.sql` command and refresh Explore.
- **Special characters in database password:** URL-encode them in `DATABASE_URL`, or use `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`.

Press **Ctrl+C** in the backend and Expo terminals to stop those processes. Stopping them does not stop the PostgreSQL Windows service.
