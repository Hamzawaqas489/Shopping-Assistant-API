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
        storeId,
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
        .input("StoreID", sql.Int, storeId)
        .query(`
          INSERT INTO Orders 
          (OrderDate, TotalAmount, PaymentStatus, TrolleyID, CustomerID, CashierID, StoreID)
          VALUES
          (@OrderDate, @TotalAmount, @PaymentStatus, @TrolleyID, @CustomerID, @CashierID, @StoreID);
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
  },

  // --- NEW: Shopping Session (Trolley) logic mapped to Orders ---

  startShoppingSession: async ({ trolleyId, customerId, listId, storeId }) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      // Create the order with 'InProgress'
      const orderRes = await tx.request()
        .input("OrderDate", sql.DateTime, new Date())
        .input("TotalAmount", sql.Decimal(10,2), 0)
        .input("PaymentStatus", sql.NVarChar(20), 'InProgress')
        .input("TrolleyID", sql.Int, trolleyId)
        .input("CustomerID", sql.Int, customerId)
        .input("StoreID", sql.Int, storeId || null)
        .input("ListID", sql.Int, listId || null)
        .query(`
          INSERT INTO Orders (OrderDate, TotalAmount, PaymentStatus, TrolleyID, CustomerID, StoreID, ListID)
          VALUES (@OrderDate, @TotalAmount, @PaymentStatus, @TrolleyID, @CustomerID, @StoreID, @ListID);
          SELECT SCOPE_IDENTITY() AS OrderID;
        `);

      const orderId = orderRes.recordset[0].OrderID;

      // Flip Trolley Status to InUse
      await tx.request()
        .input("TrolleyID", sql.Int, trolleyId)
        .query(`
          UPDATE Trolley
          SET Status = 'InUse'
          WHERE TrolleyID = @TrolleyID
        `);

      await tx.commit();
      return orderId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  addItemToOrder: async ({ orderId, productId, quantity = 1 }) => {
    const conn = await pool;
    
    // Check if the item already exists
    const checkRes = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .input("ProductID", sql.Int, productId)
      .query(`
        SELECT Quantity FROM OrderDetails
        WHERE OrderID = @OrderID AND ProductID = @ProductID
      `);

    let price = 0;
    const prodRes = await conn.request()
      .input("ProductID", sql.Int, productId)
      .query(`SELECT Price FROM Products WHERE ProductID = @ProductID`);
    if(prodRes.recordset.length) price = prodRes.recordset[0].Price;

    if (checkRes.recordset.length > 0) {
      // Update quantity
      const newQty = checkRes.recordset[0].Quantity + quantity;
      await conn.request()
        .input("OrderID", sql.Int, orderId)
        .input("ProductID", sql.Int, productId)
        .input("Quantity", sql.Int, newQty)
        .query(`
          UPDATE OrderDetails
          SET Quantity = @Quantity
          WHERE OrderID = @OrderID AND ProductID = @ProductID
        `);
      return { action: 'updated', quantity: newQty };
    } else {
      // Insert new item
      await conn.request()
        .input("OrderID", sql.Int, orderId)
        .input("ProductID", sql.Int, productId)
        .input("Quantity", sql.Int, quantity)
        .input("PriceAtPurchase", sql.Decimal(10,2), price)
        .query(`
          INSERT INTO OrderDetails (OrderID, ProductID, Quantity, PriceAtPurchase)
          VALUES (@OrderID, @ProductID, @Quantity, @PriceAtPurchase)
        `);
      return { action: 'inserted', quantity };
    }
  },

  getOrderSessionItems: async (orderId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .query(`
        SELECT 
          od.ProductID, 
          od.Quantity, 
          od.PriceAtPurchase as Price,
          p.ProductName,
          p.Company,
          p.ImageName
        FROM OrderDetails od
        JOIN Products p ON p.ProductID = od.ProductID
        WHERE od.OrderID = @OrderID
      `);
      
    return result.recordset;
  },

  requestCheckout: async (orderId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .query(`
        UPDATE Orders
        SET PaymentStatus = 'PendingCheckout'
        WHERE OrderID = @OrderID
      `);
    return result.rowsAffected[0] > 0;
  },

  confirmOrder: async (orderId, cashierId) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      // Ensure we hit 'PendingCheckout' and finalize total
      const orderCheckRes = await tx.request()
        .input("OrderID", sql.Int, orderId)
        .query(`SELECT TrolleyID FROM Orders WHERE OrderID = @OrderID AND PaymentStatus = 'PendingCheckout'`);
      
      if(orderCheckRes.recordset.length === 0) {
        throw new Error("Order is not in pending checkout state.");
      }
      
      const trolleyId = orderCheckRes.recordset[0].TrolleyID;

      // Update order to Completed
      await tx.request()
        .input("OrderID", sql.Int, orderId)
        .input("CashierID", sql.Int, cashierId)
        .query(`
          UPDATE Orders
          SET PaymentStatus = 'Completed', CashierID = @CashierID
          WHERE OrderID = @OrderID
        `);

      // Free up trolley
      if (trolleyId) {
        await tx.request()
          .input("TrolleyID", sql.Int, trolleyId)
          .query(`
            UPDATE Trolley SET Status = 'Available' WHERE TrolleyID = @TrolleyID
          `);
      }

      await tx.commit();
      return true;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  getActiveTrolleys: async (storeId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("StoreID", sql.Int, storeId)
      .query(`
        SELECT o.OrderID, o.OrderDate, o.PaymentStatus, o.TrolleyID, o.ListID,
               u.Name as CustomerName, u.Email as CustomerEmail
        FROM Orders o
        JOIN Users u ON u.UserID = o.CustomerID
        WHERE o.StoreID = @StoreID AND o.PaymentStatus = 'InProgress'
        ORDER BY o.OrderDate DESC
      `);
    return result.recordset;
  },

  getCheckoutRequests: async (storeId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("StoreID", sql.Int, storeId)
      .query(`
        SELECT o.OrderID, o.OrderDate, o.PaymentStatus, o.TrolleyID, o.ListID,
               u.Name as CustomerName, u.Email as CustomerEmail
        FROM Orders o
        JOIN Users u ON u.UserID = o.CustomerID
        WHERE o.StoreID = @StoreID AND o.PaymentStatus = 'PendingCheckout'
        ORDER BY o.OrderDate ASC
      `);
    return result.recordset;
  },

  getSessionList: async (orderId) => {
    const conn = await pool;

    // 1. Get the linked ListID from the order
    const orderRes = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .query(`SELECT ListID, StoreID FROM Orders WHERE OrderID = @OrderID`);

    if (!orderRes.recordset.length) throw new Error("Order not found");

    const { ListID, StoreID } = orderRes.recordset[0];
    if (!ListID) return null; // No list linked

    // 2. Get the list info
    const listRes = await conn.request()
      .input("ListID", sql.Int, ListID)
      .query(`SELECT ListID, ListName, StoreID FROM SharedList WHERE ListID = @ListID`);

    if (!listRes.recordset.length) return null;

    const list = listRes.recordset[0];

    // 3. Get items with availability from the session's store
    const itemsRes = await conn.request()
      .input("ListID", sql.Int, ListID)
      .input("StoreID", sql.Int, StoreID || list.StoreID)
      .query(`
        SELECT
          sli.ProductID,
          sli.Quantity,
          sli.IsPurchased,
          p.ProductName,
          p.ImageName AS ProductImage,
          COALESCE(si.Price, 0) AS Price
        FROM SharedListItems sli
        JOIN Products p ON p.ProductID = sli.ProductID
        LEFT JOIN StoreInventory si ON si.ProductID = sli.ProductID AND si.StoreID = @StoreID
        WHERE sli.ListID = @ListID
      `);

    return {
      listId: list.ListID,
      listName: list.ListName,
      items: itemsRes.recordset
    };
  }
};