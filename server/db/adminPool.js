const { Pool } = require('pg');
require('dotenv').config();

// Direct (non-pooled) connection, for one-off admin scripts (migrate/seed).
// Neon recommends the direct connection for DDL and bulk admin work,
// reserving the pooled DATABASE_URL for the running app (see server/db/pool.js).
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

const pool = connectionString
    ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
    : new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'library_db',
      });

module.exports = pool;
