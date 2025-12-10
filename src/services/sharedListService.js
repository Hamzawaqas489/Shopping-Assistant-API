// src/services/sharedListService.js
import { pool, sql } from "../database/db.js";

export const SharedListService = {
  create: async (data) => {
    const connection = await pool;
    const tx = new sql.Transaction(await pool);
    await tx.begin();
    try {
      const res = await tx.request()
        .input("SenderID", sql.Int, data.senderCustomerId)
        .input("ReceiverID", sql.Int, data.receiverCustomerId)
        .query(`
          INSERT INTO SharedList (SenderCustomerID, ReceiverCustomerID, Status)
          VALUES (@SenderID, @ReceiverID, 'Pending');
          SELECT SCOPE_IDENTITY() AS ListID;
        `);
      const listId = res.recordset[0].ListID;

      for (const item of data.items) {
        await tx.request()
          .input("ListID", sql.Int, listId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .query(`INSERT INTO SharedListItems (ListID, ProductID, Quantity) VALUES (@ListID, @ProductID, @Quantity)`);
      }

      await tx.commit();
      return listId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  getReceived: async (customerId) => {
    const connection = await pool;
    const result = await connection.request().input("CustomerID", sql.Int, customerId)
      .query(`SELECT sl.*, c.Name AS SenderName FROM SharedList sl JOIN Customer c ON c.CustomerID = sl.SenderCustomerID WHERE sl.ReceiverCustomerID=@CustomerID ORDER BY SharedDate DESC`);
    return result.recordset;
  },

  getDetails: async (listId) => {
    const connection = await pool;
    const list = await connection.request().input("ListID", sql.Int, listId)
      .query(`SELECT * FROM SharedList WHERE ListID=@ListID`);
    const items = await connection.request().input("ListID", sql.Int, listId)
      .query(`SELECT sli.*, p.ProductName FROM SharedListItems sli JOIN Products p ON p.ProductID = sli.ProductID WHERE sli.ListID=@ListID`);
    return { list: list.recordset[0], items: items.recordset };
  },

  updateStatus: async (listId, status) => {
    const connection = await pool;
    const result = await connection.request().input("ListID", sql.Int, listId).input("Status", sql.NVarChar(50), status)
      .query(`UPDATE SharedList SET Status=@Status WHERE ListID=@ListID`);
    return result.rowsAffected[0];
  }
};
