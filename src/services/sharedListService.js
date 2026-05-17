import { pool, sql } from "../database/db.js";

export const SharedListService = {

  create: async ({ listName, senderCustomerId, receiverCustomerId, storeId, items }) => {

  const conn = await pool;
  const tx = new sql.Transaction(conn);
  await tx.begin();

  try {

    /*
      Duplicate check ONLY if sharing with someone
    */
    if (receiverCustomerId) {
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
    }


    /*
       INSERT LIST
    */
    const listRes = await tx.request()
      .input("ListName", sql.NVarChar(100), listName)
      .input("SenderID", sql.Int, senderCustomerId)
      .input("ReceiverID", sql.Int, receiverCustomerId)
      .input("StoreID", sql.Int, storeId)
      .query(`
        INSERT INTO SharedList (ListName, SenderCustomerID, ReceiverCustomerID, StoreID)
        VALUES (@ListName, @SenderID, @ReceiverID, @StoreID);

        SELECT SCOPE_IDENTITY() AS ListID;
      `);

    const listId = listRes.recordset[0].ListID;


    /*
        INSERT ITEMS
    */
    for (const item of items) {

      if (!item.productId || !item.quantity)
        throw new Error("Invalid item data");

      await tx.request()
        .input("ListID", sql.Int, listId)
        .input("ProductID", sql.Int, item.productId)
        .input("Quantity", sql.Decimal(10,2), item.quantity)
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

    getUserLists: async (userId) => {
    const conn = await pool;

    try {
      // 🚨 Notice we replace p.Price with "0 AS Price" to avoid the Invalid Column error!
      const result = await conn.request()
        .input("UserID", sql.Int, userId)
        .query(`
          SELECT 
            sl.ListID, 
            sl.ListName, 
            sl.Status, 
            sl.SharedDate, 
            sl.SenderCustomerID, 
            sl.ReceiverCustomerID,
            sl.StoreID,
            s.StoreName,
            (
                SELECT 
                    sli.ListID,
                    sli.ProductID,
                    sli.Quantity,
                    sli.IsPurchased,
                    p.ProductName,
                    COALESCE(si.Price, 0) AS Price, 
                    p.ImageName AS ProductImage
                FROM SharedListItems sli
                LEFT JOIN Products p ON sli.ProductID = p.ProductID
                LEFT JOIN StoreInventory si ON si.ProductID = sli.ProductID AND si.StoreID = sl.StoreID
                WHERE sli.ListID = sl.ListID
                FOR JSON PATH
            ) AS ItemsJson
          FROM SharedList sl
          LEFT JOIN Store s ON s.StoreID = sl.StoreID
          WHERE sl.SenderCustomerID = @UserID OR sl.ReceiverCustomerID = @UserID
          ORDER BY sl.SharedDate DESC
        `);

      const lists = result.recordset.map(row => {
        return {
          ListID: row.ListID,
          ListName: row.ListName,
          Status: row.Status,
          SharedDate: row.SharedDate,
          SenderCustomerID: row.SenderCustomerID,
          ReceiverCustomerID: row.ReceiverCustomerID,
          StoreID: row.StoreID,
          StoreName: row.StoreName,
          // Parse the JSON string from SQL Server back into an array 
          Items: row.ItemsJson ? JSON.parse(row.ItemsJson) : []
        };
      });

      return lists;

    } catch (err) {
      throw err;
    }
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
          sli.IsPurchased,
          p.ProductName,
          COALESCE(si.Price, 0) AS Price,
          p.ImageName AS ProductImage
        FROM SharedListItems sli
        JOIN Products p ON p.ProductID = sli.ProductID
        LEFT JOIN StoreInventory si ON si.ProductID = sli.ProductID AND si.StoreID = @StoreID
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
  },

  copyList: async (listId, newStoreId) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      // 1. Get original list details
      const listRes = await tx.request()
        .input("ListID", sql.Int, listId)
        .query(`SELECT * FROM SharedList WHERE ListID=@ListID`);
      
      const originalList = listRes.recordset[0];
      if (!originalList) throw new Error("Original list not found");

      // 2. Insert new list with updated StoreID
      const newListRes = await tx.request()
        .input("ListName", sql.NVarChar(100), originalList.ListName + " (Copy)")
        .input("SenderID", sql.Int, originalList.SenderCustomerID)
        .input("ReceiverID", sql.Int, originalList.ReceiverCustomerID) // may be null
        .input("StoreID", sql.Int, newStoreId)
        .query(`
          INSERT INTO SharedList (ListName, SenderCustomerID, ReceiverCustomerID, StoreID)
          VALUES (@ListName, @SenderID, @ReceiverID, @StoreID);
          SELECT SCOPE_IDENTITY() AS ListID;
        `);
      
      const newListId = newListRes.recordset[0].ListID;

      // 3. Copy items
      await tx.request()
        .input("OldListID", sql.Int, listId)
        .input("NewListID", sql.Int, newListId)
        .query(`
          INSERT INTO SharedListItems (ListID, ProductID, Quantity, IsPurchased)
          SELECT @NewListID, ProductID, Quantity, 0 
          FROM SharedListItems
          WHERE ListID = @OldListID
        `);

      await tx.commit();
      return newListId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  deleteList: async (listId, userId) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const listRes = await tx.request()
        .input("ListID", sql.Int, listId)
        .query(`SELECT SenderCustomerID, ReceiverCustomerID FROM SharedList WHERE ListID=@ListID`);
      
      const list = listRes.recordset[0];
      if (!list) throw new Error("List not found");

      if (list.SenderCustomerID !== userId && list.ReceiverCustomerID !== userId) {
         throw new Error("Unauthorized to delete this list");
      }

      await tx.request()
        .input("ListID", sql.Int, listId)
        .query(`DELETE FROM SharedListItems WHERE ListID=@ListID`);

      await tx.request()
        .input("ListID", sql.Int, listId)
        .query(`DELETE FROM SharedList WHERE ListID=@ListID`);

      await tx.commit();
      return true;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  shareToFriend: async (listId, friendId) => {
    const conn = await pool;
    try {
      const result = await conn.request()
        .input("ListID", sql.Int, listId)
        .input("ReceiverCustomerID", sql.Int, friendId)
        .query(`
          UPDATE SharedList
          SET ReceiverCustomerID=@ReceiverCustomerID, Status='Pending'
          WHERE ListID=@ListID
            AND (ReceiverCustomerID IS NULL OR ReceiverCustomerID=@ReceiverCustomerID)
        `);

      if (result.rowsAffected[0] === 0) {
        throw new Error("List not found or already shared with another friend");
      }
      return true;
    }
    catch (err) {
      throw err;
    }

  }

};
