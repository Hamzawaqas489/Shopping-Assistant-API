import { pool, sql } from "../database/db.js";

export const FriendService = {

  sendRequest: async (senderId, receiverId) => {
    if (senderId === receiverId)
      throw new Error("You cannot send a friend request to yourself");

    const conn = await pool;

    // Check if request already exists
    const exists = await conn.request()
      .input("Sender", sql.Int, senderId)
      .input("Receiver", sql.Int, receiverId)
      .query(`
        SELECT 1 FROM Friends
        WHERE CustomerID=@Sender AND FriendID=@Receiver
      `);

    if (exists.recordset.length)
      throw new Error("Friend request already exists");

    await conn.request()
      .input("Sender", sql.Int, senderId)
      .input("Receiver", sql.Int, receiverId)
      .query(`
        INSERT INTO Friends (CustomerID, FriendID, Status)
        VALUES (@Sender, @Receiver, 'Pending')
      `);

    return true;
  },

  respondRequest: async (senderId, receiverId, status) => {
    const conn = await pool;
    const transaction = new sql.Transaction(conn);

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        // Update original request
        const result = await request
            .input("Sender", sql.Int, senderId)
            .input("Receiver", sql.Int, receiverId)
            .input("Status", sql.NVarChar(20), status)
            .query(`
                UPDATE Friends
                SET Status=@Status
                WHERE CustomerID=@Sender 
                  AND FriendID=@Receiver
                  AND Status='Pending'
            `);

        if (result.rowsAffected[0] === 0) {
            throw new Error("Friend request not found or already processed");
        }

        // If accepted, create reverse friendship
        if (status === 'Accepted') {

            await new sql.Request(transaction)
                .input("CustomerID", sql.Int, receiverId)
                .input("FriendID", sql.Int, senderId)
                .input("Status", sql.NVarChar(20), 'Accepted')
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM Friends 
                        WHERE CustomerID=@CustomerID 
                          AND FriendID=@FriendID
                    )
                    INSERT INTO Friends (CustomerID, FriendID, Status)
                    VALUES (@CustomerID, @FriendID, @Status)
                `);
        }

        await transaction.commit();

        return true;

    } catch (err) {

        await transaction.rollback();
        throw err;
    }
},

  getFriends: async (customerId) => {
    const conn = await pool;

    const result = await conn.request()
      .input("CustomerID", sql.Int, customerId)
      .query(`
        SELECT 
          u.UserID,
          u.Name,
          u.Email,
          u.Phone
        FROM Friends f
        JOIN Users u ON u.UserID = f.FriendID
        WHERE f.CustomerID=@CustomerID
          AND f.Status='Accepted'
      `);

    return result.recordset;
  },

  getRequests: async (customerId) => {
    const conn = await pool;

    const result = await conn.request()
      .input("CustomerID", sql.Int, customerId)
      .query(`
        SELECT 
          u.UserID AS SenderID,
          u.Name,
          u.Email
        FROM Friends f
        JOIN Users u ON u.UserID = f.CustomerID
        WHERE f.FriendID=@CustomerID
          AND f.Status='Pending'
      `);

    return result.recordset;
  }
};
