// src/services/inventoryService.js
import { pool, sql } from "../database/db.js";

export const InventoryService = {
  assignProduct: async (data) => {
    const connection = await pool;
    const result = await connection.request()
      .input("StoreID", sql.Int, data.storeId)
      .input("ProductID", sql.Int, data.productId)
      .input("StockQty", sql.Int, data.stockQty || 0)
      .input("Price", sql.Decimal(10,2), data.price)
      .query(`
        MERGE StoreInventory AS target
        USING (SELECT @StoreID AS StoreID, @ProductID AS ProductID) AS source
        ON (target.StoreID = source.StoreID AND target.ProductID = source.ProductID)
        WHEN MATCHED THEN 
          UPDATE SET StockQty=@StockQty, Price=@Price
        WHEN NOT MATCHED THEN
          INSERT (StoreID, ProductID, StockQty, Price) VALUES (@StoreID, @ProductID, @StockQty, @Price);
      `);
    return result.rowsAffected.reduce((a,b) => a+b, 0);
  },

  remove: async (storeId, productId) => {
    const connection = await pool;
    const result = await connection.request()
      .input("StoreID", sql.Int, storeId)
      .input("ProductID", sql.Int, productId)
      .query(`DELETE FROM StoreInventory WHERE StoreID=@StoreID AND ProductID=@ProductID`);
    return result.rowsAffected[0];
  },

  getStoreProducts: async (storeId) => {
    const connection = await pool;
    const result = await connection.request().input("StoreID", sql.Int, storeId)
      .query(`
        SELECT si.StoreID, si.ProductID, si.StockQty, si.Price, p.ProductName, p.ImageURL
        FROM StoreInventory si
        JOIN Products p ON p.ProductID = si.ProductID
        WHERE si.StoreID = @StoreID
      `);
    return result.recordset;
  }
};
