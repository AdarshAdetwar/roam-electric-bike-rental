const app = require('./app');
const env = require('./config/env');
const pool = require('./db/pool');

async function start() {
  await pool.query('SELECT 1');
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Roam API listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error('Could not start the Roam API:', error.message);
  process.exitCode = 1;
});
