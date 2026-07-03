import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/kania_workforce'
});

async function initDatabase() {
  try {
    console.log('Connecting to database...');
    await client.connect();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema initialization...');
    await client.query(schema);

    console.log('✓ Database initialized successfully!');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
