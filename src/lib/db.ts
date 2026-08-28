import { Pool } from 'pg';

// 只读 PostgreSQL 连接池
let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  if (pool) return pool;

  const host = process.env.DATABASE_HOST || 'database';
  const user = process.env.DATABASE_USER || 'teslamate';
  const password = process.env.DATABASE_PASS || 'your_database_password';
  const database = process.env.DATABASE_NAME || 'teslamate';
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);

  try {
    pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });
    return pool;
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool:', err);
    return null;
  }
}
