import mysql, { Pool, PoolOptions, RowDataPacket } from "mysql2/promise";
import { env } from "./env";

const poolConfig: PoolOptions = {
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const dbPool: Pool = mysql.createPool(poolConfig);

export const testDatabaseConnection = async (): Promise<void> => {
  const connection = await dbPool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const executeQuery = async <T extends RowDataPacket[]>(query: string, params: unknown[] = []): Promise<T> => {
  const [rows] = await dbPool.execute<T>(query, params);
  return rows;
};
