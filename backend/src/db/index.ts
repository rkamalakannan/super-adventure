import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getAppConfig } from '../config/env';
import * as schema from './schema';

const config = getAppConfig();

const pool = new Pool({
  connectionString: config.dbUrl,
});

export const db = drizzle(pool, { schema });

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('[DB] Connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    return false;
  }
}