import { pool, sql } from "../database/db.js";
import bcrypt from "bcrypt";

export const AuthService = {

  signup: async (data) => {
    try {
      // Get connection from pool
      const conn = await pool;

      // 1️⃣ Check if email already exists
      const emailCheckRequest = new sql.Request(conn);
      const emailCheck = await emailCheckRequest
        .input("Email", sql.NVarChar, data.email.toLowerCase())
        .query(`SELECT UserID FROM Users WHERE Email = @Email`);

      if (emailCheck.recordset.length > 0) {
        throw new Error("Email already registered");
      }

      // 2️⃣ Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // 3️⃣ Insert new user
      const insertRequest = new sql.Request(conn);
      const result = await insertRequest
        .input("Name", sql.NVarChar, data.name.trim())
        .input("Phone", sql.NVarChar, data.phone.trim())
        .input("Email", sql.NVarChar, data.email.toLowerCase())
        .input("Password", sql.NVarChar, hashedPassword)
        .input("Role", sql.NVarChar, data.role)
        .input("StoreID", sql.Int, data.storeId ?? null)
        .query(`
          INSERT INTO Users (Name, Phone, Email, Password, Role, StoreID)
          VALUES (@Name, @Phone, @Email, @Password, @Role, @StoreID)
        `);

      return result.rowsAffected[0]; // 1 if inserted successfully

    } catch (error) {
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      // Get connection from pool
      const conn = await pool;

      // 1️⃣ Fetch user by email
      const request = new sql.Request(conn);
      const result = await request
        .input("Email", sql.NVarChar, email.toLowerCase())
        .query(`
          SELECT UserID, Name, Email, Password, Role, StoreID
          FROM Users
          WHERE Email = @Email
        `);

      // 2️⃣ Check if user exists
      if (result.recordset.length === 0) return null;

      const user = result.recordset[0];

      // 3️⃣ Verify password
      const isMatch = await bcrypt.compare(password, user.Password);
      if (!isMatch) return null;

      // 4️⃣ Remove password before returning
      delete user.Password;

      // 5️⃣ Return user object (ready for JWT signing in controller)
      return user;

    } catch (error) {
      throw error;
    }
  }
};
