// src/services/userService.js
import { pool, sql } from "../database/db.js";

export const UserService = {

  // Update only profile picture
  updateProfilePic: async (id, profilePicName) => {
    const connection = await pool;

    const result = await connection.request()
      .input("UserID", sql.Int, id)
      .input("ProfilePicName", sql.NVarChar(255), profilePicName)
      .query(`
        UPDATE Users
        SET ProfilePicName = @ProfilePicName
        WHERE UserID = @UserID
      `);

    return result.rowsAffected[0];
  },

  // Update whole user
  update: async (id, { Name, Phone, Email, Password, Role, StoreID, ProfilePicName }) => {
    const connection = await pool;

    const result = await connection.request()
      .input("UserID", sql.Int, id)
      .input("Name", sql.NVarChar(100), Name)
      .input("Phone", sql.NVarChar(20), Phone)
      .input("Email", sql.NVarChar(100), Email)
      .input("Password", sql.NVarChar(255), Password)
      .input("Role", sql.NVarChar(20), Role)
      .input("StoreID", sql.Int, StoreID || null)
      .input("ProfilePicName", sql.NVarChar(255), ProfilePicName || null)
      .query(`
        UPDATE Users
        SET Name = @Name,
            Phone = @Phone,
            Email = @Email,
            Password = @Password,
            Role = @Role,
            StoreID = @StoreID,
            ProfilePicName = @ProfilePicName
        WHERE UserID = @UserID
      `);

    return result.rowsAffected[0];
  },

  // Delete a user
  remove: async (id) => {
    const connection = await pool;

    const result = await connection.request()
      .input("UserID", sql.Int, id)
      .query(`
        DELETE FROM Users
        WHERE UserID = @UserID
      `);

    return result.rowsAffected[0];
  },

  
  getById: async (id) => {
    const connection = await pool;

    const result = await connection.request()
      .input("UserID", sql.Int, id)
      .query(`
        SELECT UserID, Name, Phone, Email, Role, StoreID, ProfilePicName
        FROM Users
        WHERE UserID = @UserID
      `);

    return result.recordset[0];
  }
};
