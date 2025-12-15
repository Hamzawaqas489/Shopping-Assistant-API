import { pool, sql } from "../database/db.js";

export const SharedListService = {

  create: async ({ senderCustomerId, receiverCustomerId, items }) => {
    if (senderCustomerId === receiverCustomerId)
      throw new Error("You cannot share a list with yourself");

    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      // Prevent duplicate pending list
      const exists = await tx.request()
        .input("Sender", sql.Int, senderCustomerId)
        .input("Receiver", sql.Int, receiverCustomerId)
        .query(`
          SELECT 1 FROM SharedList
          WHERE SenderCustomerID=@Sender
            AND ReceiverCustomerID=@Receiver
            AND Status='Pending'
        `);

      if (exists.recordset.length)
        throw new Error("A pending shared list already exists");

      const listRes = await tx.request()
        .input("SenderID", sql.Int, senderCustomerId)
        .input("ReceiverID", sql.Int, receiverCustomerId)
        .query(`
          INSERT INTO SharedList (SenderCustomerID, ReceiverCustomerID, Status)
          VALUES (@SenderID, @ReceiverID, 'Pending');
          SELECT SCOPE_IDENTITY() AS ListID;
        `);

      const listId = listRes.recordset[0].ListID;

      for (const item of items) {
        await tx.request()
          .input("ListID", sql.Int, listId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .query(`
            INSERT INTO SharedListItems (ListID, ProductID, Quantity)
            VALUES (@ListID, @ProductID, @Quantity)
          `);
      }

      await tx.commit();
      return listId;

    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  getReceived: async (customerId) => {
    const conn = await pool;

    const result = await conn.request()
      .input("CustomerID", sql.Int, customerId)
      .query(`
        SELECT
          sl.ListID,
          sl.Status,
          sl.SharedDate,
          u.UserID AS SenderID,
          u.Name AS SenderName
        FROM SharedList sl
        JOIN Users u ON u.UserID = sl.SenderCustomerID
        WHERE sl.ReceiverCustomerID=@CustomerID
        ORDER BY sl.SharedDate DESC
      `);

    return result.recordset;
  },

  getDetails: async (listId, userId) => {
    const conn = await pool;

    const listRes = await conn.request()
      .input("ListID", sql.Int, listId)
      .query(`
        SELECT *
        FROM SharedList
        WHERE ListID=@ListID
      `);

    const list = listRes.recordset[0];
    if (!list) return null;

    // Authorization check
    if (list.SenderCustomerID !== userId && list.ReceiverCustomerID !== userId)
      throw new Error("Access denied");

    const itemsRes = await conn.request()
      .input("ListID", sql.Int, listId)
      .query(`
        SELECT
          sli.ProductID,
          sli.Quantity,
          p.ProductName,
          p.ImageURL
        FROM SharedListItems sli
        JOIN Products p ON p.ProductID = sli.ProductID
        WHERE sli.ListID=@ListID
      `);

    return { list, items: itemsRes.recordset };
  },

  updateStatus: async (listId, receiverId, status) => {
    const conn = await pool;

    const result = await conn.request()
      .input("ListID", sql.Int, listId)
      .input("ReceiverID", sql.Int, receiverId)
      .input("Status", sql.NVarChar(20), status)
      .query(`
        UPDATE SharedList
        SET Status=@Status
        WHERE ListID=@ListID
          AND ReceiverCustomerID=@ReceiverID
          AND Status='Pending'
      `);

    if (result.rowsAffected[0] === 0)
      throw new Error("Shared list not found or already processed");

    return true;
  }
};
