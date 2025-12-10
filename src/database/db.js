import sql from "mssql";
import { dbConfig } from "../config/dbconfig.js";

export const pool = new sql.ConnectionPool(dbConfig).connect();
export { sql };