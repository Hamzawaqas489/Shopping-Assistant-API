// src/services/friendService.js
import { pool, sql } from "../database/db.js";

export const FriendService = {
  sendRequest: async (senderId, receiverId) => {
    const connection = await pool;
    const result = await connection.request()
      .input("Sender", sql.Int, senderId)
      .input("Receiver", sql.Int, receiverId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Friendships WHERE CustomerID=@Sender AND FriendID=@Receiver)
          INSERT INTO Friendships (CustomerID, FriendID, Status) VALUES (@Sender, @Receiver, 'Pending');
      `);
    return result.rowsAffected[0];
  },

  respondRequest: async (senderId, receiverId, status) => {
    const connection = await pool;
    const result = await connection.request()
      .input("Sender", sql.Int, senderId)
      .input("Receiver", sql.Int, receiverId)
      .input("Status", sql.NVarChar(50), status)
      .query(`UPDATE Friendships SET Status=@Status WHERE CustomerID=@Sender AND FriendID=@Receiver`);
    return result.rowsAffected[0];
  },

  getFriends: async (customerId) => {
    const connection = await pool;
    const result = await connection.request().input("CustomerID", sql.Int, customerId)
      .query(`SELECT f.FriendID, c.Name, c.Email FROM Friendships f JOIN Customer c ON c.CustomerID = f.FriendID WHERE f.CustomerID=@CustomerID AND f.Status='Accepted'`);
    return result.recordset;
  },

  getRequests: async (customerId) => {
    const connection = await pool;
    const result = await connection.request().input("CustomerID", sql.Int, customerId)
      .query(`SELECT f.CustomerID AS SenderID, c.Name AS SenderName FROM Friendships f JOIN Customer c ON c.CustomerID = f.CustomerID WHERE f.FriendID=@CustomerID AND f.Status='Pending'`);
    return result.recordset;
  }
};
