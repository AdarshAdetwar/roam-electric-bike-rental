const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool(
  env.databaseUrl
    ? { connectionString: env.databaseUrl }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || 'roam',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD
      }
);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

module.exports = pool;
