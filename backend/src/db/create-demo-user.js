require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./pool');

async function createDemoUser() {
  const email = 'demo@roam.app';
  const passwordHash = await bcrypt.hash('RoamDemo123!', 12);
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (lower(email)) WHERE email IS NOT NULL
     DO UPDATE SET full_name = EXCLUDED.full_name,
                   password_hash = EXCLUDED.password_hash,
                   updated_at = now()`,
    ['Roam Demo', email, passwordHash]
  );
  console.log('Demo account is ready: Roam Demo (demo@roam.app / RoamDemo123!)');
}

createDemoUser()
  .catch((error) => {
    console.error('Could not create demo account:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
