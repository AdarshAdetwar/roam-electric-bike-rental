const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name AS "fullName", email, phone,
              created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' } });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
