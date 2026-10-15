const { Router } = require('express');
const pool = require('../db/pool');
const { expireRentals, withTransaction } = require('../services/rentals');

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

router.get('/active', async (req, res, next) => {
  try {
    const rental = await withTransaction(async (client) => {
      await expireRentals(client);
      const result = await client.query(
        `SELECT r.id, r.scooter_id AS "motorbikeId", r.starts_at AS "startsAt",
                r.ends_at AS "endsAt", r.status,
                s.name, s.category, s.location_text AS "locationText",
                s.battery_percentage AS "batteryPercentage", s.hourly_rate AS "hourlyRate"
         FROM rentals r
         JOIN scooters s ON s.id = r.scooter_id
         WHERE r.user_id = $1 AND r.status = 'active' AND r.ends_at > now()
         LIMIT 1`,
        [req.user.id]
      );
      return result.rows[0] || null;
    });
    res.json({ rental });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const rentals = await withTransaction(async (client) => {
      await expireRentals(client);
      const result = await client.query(
        `SELECT r.id, r.scooter_id AS "motorbikeId",
                r.starts_at AS "startsAt", r.ends_at AS "endsAt",
                r.ended_at AS "endedAt", r.status,
                s.name, s.category, s.location_text AS "locationText",
                s.battery_percentage AS "batteryPercentage",
                s.hourly_rate AS "hourlyRate"
         FROM rentals r
         JOIN scooters s ON s.id = r.scooter_id
         WHERE r.user_id = $1 AND r.status IN ('completed', 'expired')
         ORDER BY r.ended_at DESC, r.starts_at DESC`,
        [req.user.id]
      );
      return result.rows;
    });
    res.json({ rentals });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const motorbikeId = req.body.motorbikeId;
    if (typeof motorbikeId !== 'string' || !UUID_PATTERN.test(motorbikeId)) {
      throw httpError(400, 'VALIDATION_ERROR', 'A valid motorbikeId is required.');
    }
    const rental = await withTransaction(async (client) => {
      await expireRentals(client);
      const existing = await client.query(
        `SELECT id FROM rentals WHERE user_id = $1 AND status = 'active' FOR UPDATE`,
        [req.user.id]
      );
      if (existing.rows[0]) throw httpError(409, 'ACTIVE_RENTAL_EXISTS', 'End your current ride before renting another motorbike.');

      const motorbikeResult = await client.query(
        `SELECT id, status FROM scooters WHERE id = $1 FOR UPDATE`,
        [motorbikeId]
      );
      const motorbike = motorbikeResult.rows[0];
      if (!motorbike) throw httpError(404, 'ASSET_NOT_FOUND', 'Motorbike not found.');
      if (motorbike.status !== 'available') {
        throw httpError(409, 'ASSET_UNAVAILABLE', 'This motorbike is not currently available to rent.');
      }

      const created = await client.query(
        `INSERT INTO rentals (user_id, scooter_id, starts_at, ends_at)
         VALUES ($1, $2, now(), now() + interval '1 hour')
         RETURNING id, scooter_id AS "motorbikeId", starts_at AS "startsAt",
                   ends_at AS "endsAt", status`,
        [req.user.id, motorbikeId]
      );
      await client.query(
        `UPDATE scooters SET status = 'in-use', updated_at = now() WHERE id = $1`,
        [motorbikeId]
      );
      return created.rows[0];
    });
    res.status(201).json({ rental });
  } catch (error) {
    if (error.code === '23505') {
      return next(httpError(409, 'RENTAL_CONFLICT', 'You or another rider already has an active rental.'));
    }
    next(error);
  }
});

router.patch('/:id/end', async (req, res, next) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid rental id is required.' } });
  }
  try {
    const result = await withTransaction(async (client) => {
      await expireRentals(client);
      const rentalResult = await client.query(
        `SELECT id, scooter_id AS "motorbikeId", status
         FROM rentals WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [req.params.id, req.user.id]
      );
      const rental = rentalResult.rows[0];
      if (!rental) throw httpError(404, 'RENTAL_NOT_FOUND', 'Rental not found.');
      if (rental.status !== 'active') throw httpError(409, 'RENTAL_NOT_ACTIVE', 'This ride is no longer active.');

      const ended = await client.query(
        `UPDATE rentals
         SET status = 'completed', ended_at = now()
         WHERE id = $1
         RETURNING id, scooter_id AS "motorbikeId", starts_at AS "startsAt",
                   ends_at AS "endsAt", ended_at AS "endedAt", status`,
        [rental.id]
      );
      await client.query(
        `UPDATE scooters
         SET status = CASE WHEN battery_percentage <= 20 THEN 'low-battery' ELSE 'available' END,
             updated_at = now()
         WHERE id = $1`,
        [rental.motorbikeId]
      );
      return ended.rows[0];
    });
    res.json({ rental: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
