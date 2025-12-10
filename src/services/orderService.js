// src/services/orderService.js
import { pool, sql } from "../database/db.js";

export const OrderService = {
  create: async (data) => {
    const connection = await pool;
    const tx = new sql.Transaction(await pool);
    await tx.begin();
    try {
      const request = tx.request();
      request.input("CustomerID", sql.Int, data.customerId);
      request.input("TotalAmount", sql.Decimal(10,2), data.totalAmount || 0);
      const orderRes = await request.query(`
        INSERT INTO Orders (CustomerID, TotalAmount, PaymentStatus, Status)
        VALUES (@CustomerID, @TotalAmount, 'Pending', 'Placed');
        SELECT SCOPE_IDENTITY() AS OrderID;
      `);

      const orderId = orderRes.recordset[0].OrderID;

      for (const item of data.items) {
        await tx.request()
          .input("OrderID", sql.Int, orderId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .input("PriceAtPurchase", sql.Decimal(10,2), item.priceAtPurchase)
          .query(`
            INSERT INTO OrderDetails (OrderID, ProductID, Quantity, PriceAtPurchase)
            VALUES (@OrderID, @ProductID, @Quantity, @PriceAtPurchase);
          `);
      }

      await tx.commit();
      return orderId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  getByCustomer: async (customerId) => {
    const connection = await pool;
    const result = await connection.request().input("CustomerID", sql.Int, customerId)
      .query(`SELECT * FROM Orders WHERE CustomerID=@CustomerID ORDER BY OrderDate DESC`);
    return result.recordset;
  },

  getDetails: async (orderId) => {
    const connection = await pool;
    const order = await connection.request().input("OrderID", sql.Int, orderId)
      .query(`SELECT * FROM Orders WHERE OrderID=@OrderID`);
    const items = await connection.request().input("OrderID", sql.Int, orderId)
      .query(`
        SELECT od.ProductID, od.Quantity, od.PriceAtPurchase, p.ProductName, p.ImageURL
        FROM OrderDetails od
        JOIN Products p ON p.ProductID = od.ProductID
        WHERE od.OrderID = @OrderID
      `);
    return { order: order.recordset[0], items: items.recordset };
  },

  updateStatus: async (orderId, status) => {
    const connection = await pool;
    const result = await connection.request()
      .input("OrderID", sql.Int, orderId)
      .input("Status", sql.NVarChar(50), status)
      .query(`UPDATE Orders SET Status=@Status WHERE OrderID=@OrderID`);
    return result.rowsAffected[0];
  }
};
