import { pool, sql } from "../database/db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const AuthService = {
  SignUpUser: async (data) => {
    const connection = await pool;
    const hashed = await hashPassword(data.password);

    const result = await connection
      .request()
      .input("Name", sql.NVarChar(100), data.name)
      .input("Phone", sql.NVarChar(20), data.phone)
      .input("Email", sql.NVarChar(100), data.email)
      .input("Password", sql.NVarChar(255), hashed)
      .query(`
        INSERT INTO Customer (Name, Phone, Email, Password)
        VALUES (@Name, @Phone, @Email, @Password);
        SELECT SCOPE_IDENTITY() AS CustomerID;
      `);

    const rows = result.rowsAffected[0];
    const id = result.recordset && result.recordset[0] ? result.recordset[0].CustomerID : null;

    return { rowsAffected: rows, customerId: id };
  },

  LoginUser: async (data) => {
    const connection = await pool;

    const result = await connection
      .request()
      .input("Email", sql.NVarChar(100), data.email)
      .query(`
        SELECT CustomerID, Name, Phone, Email, Password
        FROM Customer
        WHERE Email = @Email
      `);

    if (!result.recordset || result.recordset.length === 0) return null;

    const user = result.recordset[0];
    const match = await comparePassword(data.password, user.Password);

    if (!match) return null;

    // create token (exclude password)
    const payload = { id: user.CustomerID, role: "customer", email: user.Email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

    return { id: user.CustomerID, name: user.Name, phone: user.Phone, email: user.Email, token };
  }
};
