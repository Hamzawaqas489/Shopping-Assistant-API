// src/services/orderService.js
import { pool, sql } from "../database/db.js";

export const OrderService = {

  placeOrder: async (data) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      let total = 0;

      // 1️⃣ Validate stock
      for (const item of data.items) {
        const stock = await tx.request()
          .input("StoreID", sql.Int, data.storeId)
          .input("ProductID", sql.Int, item.productId)
          .query(`
            SELECT StockQty, Price 
            FROM StoreInventory
            WHERE StoreID=@StoreID AND ProductID=@ProductID
          `);

        if (!stock.recordset.length || stock.recordset[0].StockQty < item.quantity)
          throw new Error("Insufficient stock for product " + item.productId);

        total += stock.recordset[0].Price * item.quantity;
      }

      // 2️⃣ Create order
      const orderRes = await tx.request()
        .input("CustomerID", sql.Int, data.customerId)
        .input("TrolleyID", sql.Int, data.trolleyId)
        .input("TotalAmount", sql.Decimal(10,2), total)
        .query(`
          INSERT INTO Orders (CustomerID, TrolleyID, TotalAmount, PaymentStatus)
          VALUES (@CustomerID, @TrolleyID, @TotalAmount, 'Pending');
          SELECT SCOPE_IDENTITY() AS OrderID;
        `);

      const orderId = orderRes.recordset[0].OrderID;

      // 3️⃣ Insert items & deduct stock
      for (const item of data.items) {

        const priceRes = await tx.request()
          .input("StoreID", sql.Int, data.storeId)
          .input("ProductID", sql.Int, item.productId)
          .query(`
            SELECT Price FROM StoreInventory
            WHERE StoreID=@StoreID AND ProductID=@ProductID
          `);

        const price = priceRes.recordset[0].Price;

        await tx.request()
          .input("OrderID", sql.Int, orderId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .input("PriceAtPurchase", sql.Decimal(10,2), price)
          .query(`
            INSERT INTO OrderDetails 
            VALUES (@OrderID, @ProductID, @Quantity, @PriceAtPurchase, NULL)
          `);

        await tx.request()
          .input("StoreID", sql.Int, data.storeId)
          .input("ProductID", sql.Int, item.productId)
          .input("Qty", sql.Int, item.quantity)
          .query(`
            UPDATE StoreInventory
            SET StockQty = StockQty - @Qty
            WHERE StoreID=@StoreID AND ProductID=@ProductID
          `);
      }

      // 4️⃣ Release trolley
      await tx.request()
        .input("TrolleyID", sql.Int, data.trolleyId)
        .query(`UPDATE Trolley SET Status='Available' WHERE TrolleyID=@TrolleyID`);

      await tx.commit();
      return orderId;

    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
};
