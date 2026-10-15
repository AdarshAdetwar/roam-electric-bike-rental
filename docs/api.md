# Roam REST API

Base URL: `http://localhost:3000/api`. JSON request and response bodies use `Content-Type: application/json`. Protected endpoints require `Authorization: Bearer <jwt>`.

Errors use one response shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "A motorbikeId is required." } }
```

## Authentication

### `POST /auth/register`

Public. Creates an account and signs the user in. Body:

```json
{
  "fullName": "Alex Rider",
  "identity": "alex@example.com",
  "password": "roamride123",
  "confirmPassword": "roamride123"
}
```

`identity` may be a valid email address or phone number. Phone numbers may contain spaces, parentheses and dashes; the API normalizes those characters before storing or looking up the phone. Names must be 2–80 characters and passwords at least 6 characters. Success `201`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "fullName": "Alex Rider",
    "email": "alex@example.com",
    "phone": null,
    "createdAt": "..."
  }
}
```

The mobile app stores the returned token and enters the signed-in screens. Returns `400` for invalid input and `409` if the email or phone is already registered.

### `POST /auth/login`

Public. Body:

```json
{ "identity": "demo@roam.app", "password": "RoamDemo123!" }
```

Success `200`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "fullName": "Alex Rider",
    "email": "demo@roam.app",
    "phone": null,
    "createdAt": "..."
  }
}
```

Returns `400` for invalid input and `401` for invalid credentials.

## Profile

### `GET /profile`

Protected. Returns only the authenticated user's own profile:

```json
{
  "user": {
    "id": "uuid",
    "fullName": "Alex Rider",
    "email": "alex@example.com",
    "phone": null,
    "createdAt": "..."
  }
}
```

Returns `401` for a missing or invalid JWT and `404` if the authenticated account no longer exists.

### `POST /auth/forgot-password`

Public. Body: `{ "identity": "demo@roam.app" }`. Returns `200` and the same generic message whether or not the account exists:

```json
{ "message": "If an account matches that information, password reset instructions are available." }
```

With `ASSIGNMENT_MODE=true` and an existing account, the response additionally contains `resetToken`. Tokens are single-use and expire after 20 minutes. Invalid identity syntax returns `400`.

### `POST /auth/reset-password`

Public. Body:

```json
{ "token": "<reset-token>", "password": "newpass123", "confirmPassword": "newpass123" }
```

Success `200`: `{ "message": "Password updated successfully." }`. Invalid, expired or already used tokens return `400`.

## Motorbikes

Both routes are protected.

### `GET /assets`

Returns `200`:

```json
{
  "assets": [{
    "id": "uuid",
    "name": "Roam City 01",
    "category": "City",
    "locationText": "Union Square, San Francisco",
    "batteryPercentage": 94,
    "hourlyRate": "8.50",
    "status": "available"
  }]
}
```

Status is `available`, `low-battery` or `in-use`.

### `GET /assets/:id`

Returns `{ "asset": { ... } }` with the same asset shape, `400` for malformed UUIDs, or `404` if not found.

## Rentals

All routes are protected and scoped to the JWT user. A rental lasts one hour.

### `GET /rentals/active`

Returns `200` with either `{ "rental": null }` or:

```json
{
  "rental": {
    "id": "uuid",
    "motorbikeId": "uuid",
    "startsAt": "2026-10-15T06:00:00.000Z",
    "endsAt": "2026-10-15T07:00:00.000Z",
    "status": "active",
    "name": "Roam City 01",
    "category": "City",
    "locationText": "Union Square, San Francisco",
    "batteryPercentage": 94,
    "hourlyRate": "8.50"
  }
}
```

Expired rides are transitioned before the response is built.

### `GET /rentals/history`

Protected. Returns only the authenticated user's completed and expired rentals, newest first. Expired active rentals are reconciled before the history is read.

```json
{
  "rentals": [{
    "id": "uuid",
    "motorbikeId": "uuid",
    "startsAt": "2026-10-15T06:00:00.000Z",
    "endsAt": "2026-10-15T07:00:00.000Z",
    "endedAt": "2026-10-15T06:42:00.000Z",
    "status": "completed",
    "name": "Roam City 01",
    "category": "City",
    "locationText": "Union Square, San Francisco",
    "batteryPercentage": 94,
    "hourlyRate": "8.50"
  }]
}
```

Returns an empty `rentals` array when the user has no completed or expired rentals.

### `POST /rentals`

Body: `{ "motorbikeId": "uuid" }`. Success `201`: `{ "rental": { "id": "uuid", "motorbikeId": "uuid", "startsAt": "...", "endsAt": "...", "status": "active" } }`.

Returns `400` for malformed input, `404` for an unknown motorbike, and `409` if the user already has an active ride or the motorbike is not available.

### `PATCH /rentals/:id/end`

Ends only the authenticated user's active rental. Success `200`: `{ "rental": { "id": "uuid", "motorbikeId": "uuid", "startsAt": "...", "endsAt": "...", "endedAt": "...", "status": "completed" } }`. Returns `404` for another user's or missing rental and `409` when the ride is no longer active.

## Issues

### `POST /issues`

Protected. Body: `{ "rentalId": "uuid", "description": "The rear brake is making a noise." }`. The description must contain 3–500 characters. Success `201`:

```json
{
  "issue": { "id": "uuid", "rentalId": "uuid", "description": "The rear brake is making a noise.", "createdAt": "..." },
  "message": "Issue report submitted."
}
```

Returns `400` for invalid input and `404` if the rental does not belong to the caller.

## Health check

`GET /health` is public and returns `{ "status": "ok" }`.
