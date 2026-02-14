import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  // Default to database named 'DB' when DB_DATABASE is not provided
  database: process.env.DB_DATABASE || 'DB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUSTCERT === "true"
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

export const pool = new sql.ConnectionPool(config);
export const poolConnect = pool.connect();
export { sql };
