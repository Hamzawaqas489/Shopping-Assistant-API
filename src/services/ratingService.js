// src/services/ratingService.js
import { pool, sql } from "../database/db.js";

export const RatingService = {
  add: async (data) => {
    const connection = await pool;
    const result = await connection.request()
      .input("Value", sql.Int, data.value)
      .input("ReviewText", sql.NVarChar(sql.MAX), data.reviewText || null)
      .input("ProductID", sql.Int, data.productId)
      .input("CustomerID", sql.Int, data.customerId)
      .query(`
        INSERT INTO Rating (Value, ReviewText, ProductID, CustomerID)
        VALUES (@Value, @ReviewText, @ProductID, @CustomerID);
      `);
    return result.rowsAffected[0];
  },

  getByProduct: async (productId) => {
    const connection = await pool;
    const result = await connection.request().input("ProductID", sql.Int, productId)
      .query(`SELECT r.*, c.Name as CustomerName FROM Rating r JOIN Customer c ON c.CustomerID = r.CustomerID WHERE r.ProductID=@ProductID ORDER BY CreatedAt DESC`);
    return result.recordset;
  }
};
