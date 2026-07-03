import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/kania_workforce'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
