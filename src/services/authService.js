import { pool, sql } from "../database/db.js";
import bcrypt from "bcrypt";

import dotenv from "dotenv";
dotenv.config();


export const AuthService = {

  signup: async (data) => {
    try {
      // Get connection from pool
      const conn = await pool;

      // 1️⃣ Check if email already exists
      const emailCheckRequest = new sql.Request(conn);
      const emailCheck = await emailCheckRequest
        .input("Email", sql.NVarChar, data.Email.toLowerCase())
        .query(`SELECT UserID FROM Users WHERE Email = @Email`);

      if (emailCheck.recordset.length > 0) {
        throw new Error("Email already registered");
      }

      // 2️⃣ Hash password
      const hashedPassword = await bcrypt.hash(data.Password, 10);

      // 3️⃣ Insert new user
      const insertRequest = new sql.Request(conn);
      const result = await insertRequest
        .input("Name", sql.NVarChar, data.Name)
        .input("Phone", sql.NVarChar, data.Phone)
        .input("Email", sql.NVarChar, data.Email)
        .input("Password", sql.NVarChar, hashedPassword)
        .query(`
          INSERT INTO Users (Name, Phone, Email, Password)
          OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.Phone
          VALUES (@Name, @Phone, @Email, @Password)
        `);

      return result.recordset[0];

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
          SELECT UserID, Name, Phone, Email, Password, Role, ProfilePicName, StoreID
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
