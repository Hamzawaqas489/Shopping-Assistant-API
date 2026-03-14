import { pool, sql } from "../database/db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

export const AuthService = {
  signup: async (data) => {
    try {
      const conn = await pool;

      const emailCheckRequest = new sql.Request(conn);
      const emailCheck = await emailCheckRequest
        .input("Email", sql.NVarChar, data.Email.toLowerCase())
        .query(`SELECT UserID FROM Users WHERE Email = @Email`);

      if (emailCheck.recordset.length > 0) {
        throw new Error("Email already registered");
      }

      const hashedPassword = await bcrypt.hash(data.Password, 10);

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
      const conn = await pool;

      const request = new sql.Request(conn);
      const result = await request
        .input("Email", sql.NVarChar, email.toLowerCase())
        .query(`
          SELECT UserID, Name, Phone, Email, Password, Role, ProfilePicName, StoreID
          FROM Users
          WHERE Email = @Email
          `);

      if (result.recordset.length === 0) return null;

      const user = result.recordset[0];

      const isMatch = await bcrypt.compare(password, user.Password);
      if (!isMatch) return null;

      delete user.Password;

      return user;

    } catch (error) {
      throw error;
    }
  }
};
