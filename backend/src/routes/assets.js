const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, location_text AS "locationText",
              battery_percentage AS "batteryPercentage", hourly_rate AS "hourlyRate", status
       FROM scooters
       ORDER BY name`
    );
    res.json({ assets: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid motorbike id is required.' } });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, category, location_text AS "locationText",
              battery_percentage AS "batteryPercentage", hourly_rate AS "hourlyRate", status
       FROM scooters WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { code: 'ASSET_NOT_FOUND', message: 'Motorbike not found.' } });
    }
    res.json({ asset: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
