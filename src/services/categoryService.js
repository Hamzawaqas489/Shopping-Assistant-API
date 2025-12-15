import { pool, sql } from "../database/db.js";

export const CategoryService = {

  getCategories: async () => {
    const connection = await pool;
    const result = await connection.request()
      .query(`
        SELECT CategoryID, CategoryName 
        FROM Category 
        ORDER BY CategoryName
      `);
    return result.recordset;
  },

  create: async ({ categoryName }) => {
    const connection = await pool;

    const result = await connection.request()
      .input("CategoryName", sql.NVarChar(100), categoryName)
      .query(`
        INSERT INTO Category (CategoryName)
        VALUES (@CategoryName)
      `);

    return result.rowsAffected[0];
  },

  update: async (id, { categoryName }) => {
    const connection = await pool;

    const result = await connection.request()
      .input("CategoryID", sql.Int, id)
      .input("CategoryName", sql.NVarChar(100), categoryName)
      .query(`
        UPDATE Category
        SET CategoryName = @CategoryName
        WHERE CategoryID = @CategoryID
      `);

    return result.rowsAffected[0];
  },

  remove: async (id) => {
    const connection = await pool;

    const result = await connection.request()
      .input("CategoryID", sql.Int, id)
      .query(`
        DELETE FROM Category 
        WHERE CategoryID = @CategoryID
      `);

    return result.rowsAffected[0];
  }
};
