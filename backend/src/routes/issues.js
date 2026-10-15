const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post('/', async (req, res, next) => {
  const rentalId = req.body.rentalId;
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  if (typeof rentalId !== 'string' || !UUID_PATTERN.test(rentalId)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid rentalId is required.' } });
  }
  if (description.length < 3 || description.length > 500) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Describe the issue in 3 to 500 characters.' } });
  }
  try {
    const result = await pool.query(
      `INSERT INTO issues (rental_id, user_id, description)
       SELECT id, user_id, $3
       FROM rentals
       WHERE id = $1 AND user_id = $2
       RETURNING id, rental_id AS "rentalId", description, created_at AS "createdAt"`,
      [rentalId, req.user.id, description]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { code: 'RENTAL_NOT_FOUND', message: 'Rental not found.' } });
    }
    res.status(201).json({ issue: result.rows[0], message: 'Issue report submitted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
