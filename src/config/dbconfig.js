import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false, // for local SQL Server
    trustServerCertificate: true
  }
};