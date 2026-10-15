const pool = require('../db/pool');

async function expireRentals(client) {
  await client.query(
    `WITH expired AS (
       UPDATE rentals
       SET status = 'expired', ended_at = ends_at
       WHERE status = 'active' AND ends_at <= now()
       RETURNING scooter_id
     )
     UPDATE scooters AS s
     SET status = CASE WHEN s.battery_percentage <= 20 THEN 'low-battery' ELSE 'available' END,
         updated_at = now()
     FROM expired
     WHERE s.id = expired.scooter_id AND s.status = 'in-use'`
  );
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { expireRentals, withTransaction };
