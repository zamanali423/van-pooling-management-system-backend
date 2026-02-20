const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL Database Connected Successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('Database Connection Failed:', err.message);
    return false;
  }
};

const disconnectDB = async () => {
  try {
    await pool.end();
    console.log('PostgreSQL Database Disconnected Successfully');
    return true;
  } catch (err) {
    console.error('Database Disconnection Failed:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  connectDB,
  disconnectDB,
};
