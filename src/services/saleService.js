import { pool, sql } from "../database/db.js";

export const SaleService = {
  createSale: async (storeId, saleName, discountPercentage, applyToAll, categoryIds) => {
    const connection = await pool;
    const transaction = new sql.Transaction(connection);
    
    try {
      await transaction.begin();

      const request = new sql.Request(transaction);
      const saleResult = await request
        .input("StoreID", sql.Int, storeId)
        .input("SaleName", sql.NVarChar(100), saleName)
        .input("DiscountPercentage", sql.Decimal(5, 2), discountPercentage)
        .input("ApplyToAll", sql.Bit, applyToAll ? 1 : 0)
        .query(`
          INSERT INTO StoreSales (StoreID, SaleName, DiscountPercentage, ApplyToAll, IsActive)
          OUTPUT INSERTED.SaleID
          VALUES (@StoreID, @SaleName, @DiscountPercentage, @ApplyToAll, 1)
        `);

      const saleId = saleResult.recordset[0].SaleID;

      if (!applyToAll && categoryIds && categoryIds.length > 0) {
        for (const catId of categoryIds) {
          const req2 = new sql.Request(transaction);
          await req2
            .input("SaleID", sql.Int, saleId)
            .input("CategoryID", sql.Int, catId)
            .query(`
              INSERT INTO StoreSaleCategories (SaleID, CategoryID)
              VALUES (@SaleID, @CategoryID)
            `);
        }
      }

      await transaction.commit();
      return { success: true, saleId };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  endSale: async (saleId, storeId) => {
    const request = (await pool).request();
    const result = await request
      .input("SaleID", sql.Int, saleId)
      .input("StoreID", sql.Int, storeId)
      .query(`
        UPDATE StoreSales
        SET IsActive = 0
        WHERE SaleID = @SaleID AND StoreID = @StoreID
      `);
    return result.rowsAffected[0] > 0;
  },

  getActiveSalesForStore: async (storeId) => {
    const request = (await pool).request();
    const result = await request
      .input("StoreID", sql.Int, storeId)
      .query(`
        SELECT s.SaleID, s.SaleName, s.DiscountPercentage, s.ApplyToAll, s.CreatedAt,
          (
            SELECT c.CategoryID, c.CategoryName 
            FROM StoreSaleCategories sc 
            JOIN Category c ON sc.CategoryID = c.CategoryID 
            WHERE sc.SaleID = s.SaleID 
            FOR JSON PATH
          ) as Categories
        FROM StoreSales s
        WHERE s.StoreID = @StoreID AND s.IsActive = 1
        ORDER BY s.CreatedAt DESC
      `);
      
    return result.recordset.map(row => ({
      ...row,
      Categories: row.Categories ? JSON.parse(row.Categories) : []
    }));
  },

  getAllActiveSales: async () => {
    const request = (await pool).request();
    const result = await request.query(`
      SELECT s.SaleID, s.SaleName, s.DiscountPercentage, s.ApplyToAll, s.StoreID, st.StoreName,
        (
          SELECT c.CategoryName 
          FROM StoreSaleCategories sc 
          JOIN Category c ON sc.CategoryID = c.CategoryID 
          WHERE sc.SaleID = s.SaleID 
          FOR JSON PATH
        ) as Categories
      FROM StoreSales s
      JOIN Store st ON s.StoreID = st.StoreID
      WHERE s.IsActive = 1
      ORDER BY s.CreatedAt DESC
    `);
    
    return result.recordset.map(row => ({
      ...row,
      Categories: row.Categories ? JSON.parse(row.Categories).map(c => c.CategoryName) : []
    }));
  }
};
