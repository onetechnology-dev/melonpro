import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env and .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '266$66M$ng',
  database: process.env.DB_NAME || 'melonpro_v1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

export const pool = mysql.createPool(dbConfig);

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

export async function execute(sql: string, params: any[] = []): Promise<any> {
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function checkConnection(): Promise<{ ok: boolean; message: string; tables: number }> {
  try {
    const rows = await query<any[]>('SHOW TABLES');
    return { ok: true, message: 'Connected to MariaDB/MySQL successfully', tables: rows.length };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Database connection error', tables: 0 };
  }
}
