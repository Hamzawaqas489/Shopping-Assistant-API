import { pool, sql } from "../database/db.js";

export const OrderService = {

  getAll: async () => {
    const conn = await pool;
    const result = await conn.request().query(`
      SELECT * FROM Orders ORDER BY OrderDate DESC
    `);
    return result.recordset;
  },

  
  getById: async (id) => {
    const conn = await pool;

    const order = await conn.request()
      .input("OrderID", sql.Int, id)
      .query(`SELECT * FROM Orders WHERE OrderID=@OrderID`);

    if (!order.recordset.length) return null;

    const items = await conn.request()
      .input("OrderID", sql.Int, id)
      .query(`
        SELECT od.*, p.ProductName
        FROM OrderDetails od
        JOIN Products p ON p.ProductID = od.ProductID
        WHERE od.OrderID=@OrderID
      `);

    return {
      ...order.recordset[0],
      items: items.recordset
    };
  },

  
  updatePaymentStatus: async (id, status) => {
    const conn = await pool;
    const result = await conn.request()
      .input("OrderID", sql.Int, id)
      .input("PaymentStatus", sql.NVarChar(20), status)
      .query(`
        UPDATE Orders
        SET PaymentStatus=@PaymentStatus
        WHERE OrderID=@OrderID
      `);

    return result.rowsAffected[0];
  },

  
  remove: async (id) => {
    const conn = await pool;

    await conn.request()
      .input("OrderID", sql.Int, id)
      .query(`DELETE FROM OrderDetails WHERE OrderID=@OrderID`);

    const result = await conn.request()
      .input("OrderID", sql.Int, id)
      .query(`DELETE FROM Orders WHERE OrderID=@OrderID`);

    return result.rowsAffected[0];
  },


rateProduct: async ({ orderId, productId, customerId, rating }) => {
  const conn = await pool;

  // 1️⃣ Verify order belongs to customer & product exists in order
  const verify = await conn.request()
    .input("OrderID", sql.Int, orderId)
    .input("ProductID", sql.Int, productId)
    .input("CustomerID", sql.Int, customerId)
    .query(`
      SELECT od.Rating
      FROM OrderDetails od
      JOIN Orders o ON o.OrderID = od.OrderID
      WHERE od.OrderID=@OrderID
        AND od.ProductID=@ProductID
        AND o.CustomerID=@CustomerID
    `);

  if (!verify.recordset.length)
    throw new Error("Invalid order or product");

  if (verify.recordset[0].Rating !== null)
    throw new Error("Product already rated");

  // 2️⃣ Update rating
  const result = await conn.request()
    .input("OrderID", sql.Int, orderId)
    .input("ProductID", sql.Int, productId)
    .input("Rating", sql.Int, rating)
    .query(`
      UPDATE OrderDetails
      SET Rating=@Rating
      WHERE OrderID=@OrderID AND ProductID=@ProductID
    `);

  return result.rowsAffected[0];
},


  createWithDetails: async (data) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const {
        orderDate,
        paymentStatus,
        trolleyId,
        customerId,
        cashierId,
        items
      } = data;

      let totalAmount = 0;

      // 🔹 Calculate total
      items.forEach(i => {
        totalAmount += i.price * i.quantity;
      });

      // 🔹 Create Order
      const orderRes = await tx.request()
        .input("OrderDate", sql.DateTime, orderDate)
        .input("TotalAmount", sql.Decimal(10,2), totalAmount)
        .input("PaymentStatus", sql.NVarChar(20), paymentStatus)
        .input("TrolleyID", sql.Int, trolleyId)
        .input("CustomerID", sql.Int, customerId)
        .input("CashierID", sql.Int, cashierId)
        .query(`
          INSERT INTO Orders 
          (OrderDate, TotalAmount, PaymentStatus, TrolleyID, CustomerID, CashierID)
          VALUES
          (@OrderDate, @TotalAmount, @PaymentStatus, @TrolleyID, @CustomerID, @CashierID);
          SELECT SCOPE_IDENTITY() AS OrderID;
        `);

      const orderId = orderRes.recordset[0].OrderID;

      // 🔹 Insert Order Details
      for (const item of items) {
        await tx.request()
          .input("OrderID", sql.Int, orderId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .input("PriceAtPurchase", sql.Decimal(10,2), item.price)
          .query(`
            INSERT INTO OrderDetails
            (OrderID, ProductID, Quantity, PriceAtPurchase, Rating)
            VALUES
            (@OrderID, @ProductID, @Quantity, @PriceAtPurchase, NULL)
          `);
      }

      // 🔹 Release trolley
      await tx.request()
        .input("TrolleyID", sql.Int, trolleyId)
        .query(`UPDATE Trolley SET Status='Available' WHERE TrolleyID=@TrolleyID`);

      await tx.commit();
      return orderId;

    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }


};