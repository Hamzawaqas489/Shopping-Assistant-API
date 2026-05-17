// src/services/userService.js
import { pool, sql } from "../database/db.js";
import { hashPassword } from "../utils/hash.js";

export const UserService = {

  getOwner: async (id) => {
    const connection = await pool;

    const result = await connection.request()
      .input("UserID", sql.Int, id)
      .query(`
        SELECT u.UserID, u.Name, u.Phone, u.Email, u.Role, u.StoreID, u.ProfilePicName
        FROM Users u
        WHERE u.UserID = @UserID AND u.Role = 'owner'
      `);

    return result.recordset[0];
  },

  // Get all employees for a specific store (excludes owner)
  getStoreEmployees: async (storeId) => {
    const connection = await pool;

    const result = await connection.request()
      .input("StoreID", sql.Int, storeId)
      .query(`
        SELECT UserID, Name, Phone, Email, Role, StoreID, ProfilePicName, Status
        FROM Users
        WHERE StoreID = @StoreID AND Role != 'owner'
        ORDER BY Role, Name
      `);

    return result.recordset;
  },

  addEmployee: async ({ Name, Phone, Email, Password, Role, StoreID, ProfilePicName }) => {
    const connection = await pool;

    const hashedPassword = await hashPassword(Password);

    const result = await connection.request()
      .input("Name", sql.NVarChar(100), Name)
      .input("Phone", sql.NVarChar(20), Phone)
      .input("Email", sql.NVarChar(100), Email)
      .input("Password", sql.NVarChar(255), hashedPassword)
      .input("Role", sql.NVarChar(20), Role)
      .input("Status", sql.NVarChar(20), "active") // Default status value
      .input("StoreID", sql.Int, StoreID || null) // Assuming StoreID is optional
      .input("ProfilePicName", sql.NVarChar(255), ProfilePicName || null) // Optional profile picture filename
      .query(`
        INSERT INTO Users (Name, Phone, Email, Password, Role, Status, StoreID, ProfilePicName)
        VALUES (@Name, @Phone, @Email, @Password, @Role, @Status, @StoreID, @ProfilePicName)
      `);

    // Return the number of rows affected (should be 1 if successful)
    return result.rowsAffected[0];
  },

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
  },

  getCashiers: async () => {
    const connection = await pool;

    const result = await connection.request()
      .query(`
        SELECT UserID, Name, Phone, Email, Role, StoreID, ProfilePicName, Status
        FROM Users
        WHERE Role = 'cashier'
      `);

    return result.recordset;
  },

  updateRole: async (id, role) => {
  const connection = await pool;

  const result = await connection.request()
    .input("UserID", sql.Int, id)
    .input("Role", sql.NVarChar(20), role)
    .query(`
      UPDATE Users
      SET Role = @Role
      WHERE UserID = @UserID
    `);

  return result.rowsAffected[0];
},

updateStatus: async (id, status) => {
  const connection = await pool;

  const result = await connection.request()
    .input("UserID", sql.Int, id)
    .input("Status", sql.NVarChar(20), status)
    .query(`
      UPDATE Users
      SET Status = @Status
      WHERE UserID = @UserID
    `);

  return result.rowsAffected[0];
},

checkContacts: async (phoneNumbers, userId) => {
  if (!phoneNumbers || phoneNumbers.length === 0) return [];
  
  const connection = await pool;
  const request = connection.request();
  
  const params = [];
  phoneNumbers.forEach((phone, index) => {
    const paramName = `phone${index}`;
    request.input(paramName, sql.NVarChar(20), phone);
    params.push(`@${paramName}`);
  });

  if (userId) {
    request.input("CurrentUserID", sql.Int, userId);
  }

  const query = `
    SELECT UserID, Name, Phone, ProfilePicName
    FROM Users
    WHERE Phone IN (${params.join(',')})
      AND Role = 'customer'
      ${userId ? "AND UserID != @CurrentUserID" : ""}
  `;

  const result = await request.query(query);
  return result.recordset;
},


};
