import { Pool, types } from 'pg';

// 关键时区修复：PostgreSQL 的 timestamp without time zone 存储的是 UTC 时间
// 必须解析为标准 ISO UTC 字符串，否则 pg 驱动会将其当作本地时区解析导致快/慢 8 小时
types.setTypeParser(1114, (stringValue: string) => {
  if (!stringValue) return null;
  // 转换为 ISO UTC 格式: 2026-08-29T04:40:27.093Z
  const isoStr = stringValue.replace(' ', 'T') + 'Z';
  return new Date(isoStr);
});

// TIMESTAMPTZ 类型 (OID 1184)
types.setTypeParser(1184, (stringValue: string) => {
  return stringValue ? new Date(stringValue) : null;
});

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
