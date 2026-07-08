import { pool, sql } from "../database/db.js";

const ORDER_STATUS = {
  inProgress: "InProgress",
  pendingCheckout: "PendingCheckout",
  completed: "Completed",
  cancelled: "Cancelled",
};

const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (value) => {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const minutesSince = (value) => {
  const date = toDate(value);
  if (!date) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
};

const formatDuration = (value) => {
  const minutes = minutesSince(value);
  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours} hr`
    : `${hours} hr ${remainingMinutes} min`;
};

const formatWaitTime = (value) => {
  const duration = formatDuration(value);
  return duration === "Just now" ? duration : `${duration} ago`;
};

const summarizeOrder = (order, isCheckoutRequest = false) => {
  const itemsCount = Math.round(toNumber(order.ItemsCount));
  const plannedCount = Math.round(toNumber(order.PlannedCount));
  const requestedAt = order.CheckoutRequestedAt || order.OrderDate;
  const linkedListName = order.LinkedListName || "No linked list";
  const scanProgress = plannedCount > 0
    ? `${itemsCount}/${plannedCount} items scanned`
    : `${itemsCount} items scanned`;
  const verificationStatus = plannedCount > 0
    ? `${itemsCount}/${plannedCount} items matched`
    : `${itemsCount} items ready`;

  return {
    OrderID: order.OrderID,
    CustomerName: order.CustomerName || "Customer",
    CustomerEmail: order.CustomerEmail || "",
    TrolleyID: order.TrolleyID,
    ItemsCount: itemsCount,
    TotalAmount: toNumber(order.TotalAmount),
    StartedAt: formatTime(order.OrderDate),
    SessionTime: formatDuration(order.OrderDate),
    LinkedListName: linkedListName,
    ScanProgress: scanProgress,
    RequestedAt: isCheckoutRequest ? formatTime(requestedAt) : undefined,
    VerificationStatus: isCheckoutRequest ? verificationStatus : undefined,
    WaitTime: isCheckoutRequest ? formatWaitTime(requestedAt) : undefined,
  };
};

const orderSummarySelect = `
  SELECT
    o.OrderID,
    o.OrderDate,
    o.CheckoutRequestedAt,
    o.PaymentStatus,
    o.TrolleyID,
    o.ListID,
    o.TotalAmount,
    o.CustomerID,
    u.Name AS CustomerName,
    u.Email AS CustomerEmail,
    sl.ListName AS LinkedListName,
    ISNULL((
      SELECT SUM(od.Quantity)
      FROM OrderDetails od
      WHERE od.OrderID = o.OrderID
    ), 0) AS ItemsCount,
    ISNULL((
      SELECT SUM(sli.Quantity)
      FROM SharedListItems sli
      WHERE sli.ListID = o.ListID
    ), 0) AS PlannedCount
  FROM Orders o
  LEFT JOIN Users u ON u.UserID = o.CustomerID
  LEFT JOIN SharedList sl ON sl.ListID = o.ListID
`;

const getOrderItems = async (connOrTx, orderId) => {
  const request = connOrTx.request
    ? connOrTx.request()
    : new sql.Request(connOrTx);

  const result = await request
    .input("OrderID", sql.Int, orderId)
    .query(`
      SELECT
        od.OrderID,
        od.ProductID,
        od.Quantity,
        od.PriceAtPurchase AS Price,
        od.PriceAtPurchase,
        CAST(od.Quantity * od.PriceAtPurchase AS DECIMAL(10, 2)) AS LineTotal,
        od.Rating,
        p.ProductName,
        p.Company,
        p.ImageName,
        p.ImageName AS ProductImage,
        p.QRCode,
        si.StockQty,
        si.Price AS OriginalPrice,
        COALESCE(
          (SELECT MAX(ss.DiscountPercentage)
           FROM StoreSales ss
           WHERE ss.StoreID = o.StoreID AND ss.IsActive = 1
           AND (ss.ApplyToAll = 1 OR EXISTS (SELECT 1 FROM StoreSaleCategories ssc WHERE ssc.SaleID = ss.SaleID AND ssc.CategoryID = p.CategoryID))
          ), 0) AS DiscountPercentage
      FROM OrderDetails od
      INNER JOIN Orders o ON o.OrderID = od.OrderID
      INNER JOIN Products p ON p.ProductID = od.ProductID
      LEFT JOIN StoreInventory si
        ON si.ProductID = od.ProductID
       AND si.StoreID = o.StoreID
      WHERE od.OrderID = @OrderID
      ORDER BY p.ProductName
    `);

  return result.recordset;
};

const refreshOrderTotal = async (tx, orderId) => {
  await new sql.Request(tx)
    .input("OrderID", sql.Int, orderId)
    .query(`
      UPDATE Orders
      SET TotalAmount = ISNULL((
        SELECT SUM(CAST(Quantity AS DECIMAL(10, 2)) * PriceAtPurchase)
        FROM OrderDetails
        WHERE OrderID = @OrderID
      ), 0)
      WHERE OrderID = @OrderID
    `);
};

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
      .query(`SELECT * FROM Orders WHERE OrderID = @OrderID`);

    if (!order.recordset.length) {
      return null;
    }

    const items = await getOrderItems(conn, id);

    return {
      ...order.recordset[0],
      items,
    };
  },

  updatePaymentStatus: async (id, status) => {
    const conn = await pool;
    const result = await conn.request()
      .input("OrderID", sql.Int, id)
      .input("PaymentStatus", sql.NVarChar(30), status)
      .query(`
        UPDATE Orders
        SET PaymentStatus = @PaymentStatus
        WHERE OrderID = @OrderID
      `);

    return result.rowsAffected[0];
  },

  remove: async (id) => {
    const conn = await pool;

    await conn.request()
      .input("OrderID", sql.Int, id)
      .query(`DELETE FROM OrderDetails WHERE OrderID = @OrderID`);

    const result = await conn.request()
      .input("OrderID", sql.Int, id)
      .query(`DELETE FROM Orders WHERE OrderID = @OrderID`);

    return result.rowsAffected[0];
  },

  rateProduct: async ({ orderId, productId, customerId, rating }) => {
    const conn = await pool;

    const verify = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .input("ProductID", sql.Int, productId)
      .input("CustomerID", sql.Int, customerId)
      .query(`
        SELECT od.Rating
        FROM OrderDetails od
        JOIN Orders o ON o.OrderID = od.OrderID
        WHERE od.OrderID = @OrderID
          AND od.ProductID = @ProductID
          AND o.CustomerID = @CustomerID
      `);

    if (!verify.recordset.length) {
      throw new Error("Invalid order or product");
    }

    if (verify.recordset[0].Rating !== null) {
      throw new Error("Product already rated");
    }

    const result = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .input("ProductID", sql.Int, productId)
      .input("Rating", sql.Int, rating)
      .query(`
        UPDATE OrderDetails
        SET Rating = @Rating
        WHERE OrderID = @OrderID AND ProductID = @ProductID
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
        items,
      } = data;

      const totalAmount = items.reduce(
        (total, item) => total + toNumber(item.price) * toNumber(item.quantity),
        0,
      );

      const orderRes = await new sql.Request(tx)
        .input("OrderDate", sql.DateTime, orderDate || new Date())
        .input("TotalAmount", sql.Decimal(10, 2), totalAmount)
        .input("PaymentStatus", sql.NVarChar(30), paymentStatus)
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

      for (const item of items) {
        await new sql.Request(tx)
          .input("OrderID", sql.Int, orderId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .input("PriceAtPurchase", sql.Decimal(10, 2), item.price)
          .query(`
            INSERT INTO OrderDetails
            (OrderID, ProductID, Quantity, PriceAtPurchase, Rating)
            VALUES
            (@OrderID, @ProductID, @Quantity, @PriceAtPurchase, NULL)
          `);
      }

      if (trolleyId) {
        await new sql.Request(tx)
          .input("TrolleyID", sql.Int, trolleyId)
          .query(`UPDATE Trolley SET Status = 'Available' WHERE TrolleyID = @TrolleyID`);
      }

      await tx.commit();
      return orderId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  startShoppingSession: async ({ trolleyId, trolleyCode, customerId, listId }) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      let trolleyResult;

      if (trolleyId) {
        trolleyResult = await new sql.Request(tx)
          .input("TrolleyID", sql.Int, trolleyId)
          .query(`
            SELECT TOP 1 TrolleyID, QRCodeData, Status, StoreID
            FROM Trolley
            WHERE TrolleyID = @TrolleyID
          `);
      } else {
        trolleyResult = await new sql.Request(tx)
          .input("QRCode", sql.NVarChar(300), trolleyCode)
          .query(`
            SELECT TOP 1 TrolleyID, QRCodeData, Status, StoreID
            FROM Trolley
            WHERE QRCodeData = @QRCode
               OR CAST(TrolleyID AS NVARCHAR(30)) = @QRCode
          `);
      }

      const trolley = trolleyResult.recordset[0];
      if (!trolley) {
        throw new Error("Trolley was not found.");
      }

      const activeOrder = await new sql.Request(tx)
        .input("TrolleyID", sql.Int, trolley.TrolleyID)
        .input("InProgress", sql.NVarChar(30), ORDER_STATUS.inProgress)
        .input("PendingCheckout", sql.NVarChar(30), ORDER_STATUS.pendingCheckout)
        .query(`
          SELECT TOP 1 OrderID, CustomerID, PaymentStatus
          FROM Orders
          WHERE TrolleyID = @TrolleyID
            AND PaymentStatus IN (@InProgress, @PendingCheckout)
          ORDER BY OrderID DESC
        `);

      const existingOrder = activeOrder.recordset[0];
      if (existingOrder) {
        if (
          existingOrder.CustomerID === customerId &&
          existingOrder.PaymentStatus === ORDER_STATUS.inProgress
        ) {
          await tx.commit();
          return existingOrder.OrderID;
        }

        throw new Error("This trolley is already in use.");
      }

      if (trolley.Status && trolley.Status !== "Available") {
        throw new Error(`This trolley is ${trolley.Status}.`);
      }

      if (listId) {
        const listResult = await new sql.Request(tx)
          .input("ListID", sql.Int, listId)
          .input("StoreID", sql.Int, trolley.StoreID)
          .query(`
            SELECT TOP 1 ListID
            FROM SharedList
            WHERE ListID = @ListID
              AND StoreID = @StoreID
          `);

        if (!listResult.recordset.length) {
          throw new Error("Selected shopping list does not belong to this trolley store.");
        }
      }

      const orderRes = await new sql.Request(tx)
        .input("OrderDate", sql.DateTime, new Date())
        .input("TotalAmount", sql.Decimal(10, 2), 0)
        .input("PaymentStatus", sql.NVarChar(30), ORDER_STATUS.inProgress)
        .input("TrolleyID", sql.Int, trolley.TrolleyID)
        .input("CustomerID", sql.Int, customerId)
        .input("StoreID", sql.Int, trolley.StoreID)
        .input("ListID", sql.Int, listId || null)
        .query(`
          INSERT INTO Orders (
            OrderDate,
            TotalAmount,
            PaymentStatus,
            TrolleyID,
            CustomerID,
            StoreID,
            ListID
          )
          VALUES (
            @OrderDate,
            @TotalAmount,
            @PaymentStatus,
            @TrolleyID,
            @CustomerID,
            @StoreID,
            @ListID
          );
          SELECT SCOPE_IDENTITY() AS OrderID;
        `);

      await new sql.Request(tx)
        .input("TrolleyID", sql.Int, trolley.TrolleyID)
        .query(`
          UPDATE Trolley
          SET Status = 'InUse'
          WHERE TrolleyID = @TrolleyID
        `);

      await tx.commit();
      return orderRes.recordset[0].OrderID;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  addItemToOrder: async ({ orderId, productId, quantity = 1 }) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const orderResult = await new sql.Request(tx)
        .input("OrderID", sql.Int, orderId)
        .query(`
          SELECT TOP 1 OrderID, StoreID, ListID, PaymentStatus
          FROM Orders
          WHERE OrderID = @OrderID
        `);

      const order = orderResult.recordset[0];
      if (!order) {
        throw new Error("Trolley session was not found.");
      }

      if (order.PaymentStatus !== ORDER_STATUS.inProgress) {
        throw new Error("This trolley session is not open for scanning.");
      }

      const listRestrictedResult = await new sql.Request(tx)
        .input("ListID", sql.Int, order.ListID)
        .query(`
          SELECT TOP 1 *
          FROM SharedList
          WHERE ListID = @ListID
        `);
        const listRestricted = listRestrictedResult.recordset[0];

        if(listRestricted.isRestricted){
      const listProductResult = await new sql.Request(tx)
        .input("ListID", sql.Int, order.ListID)
        .input("ProductID",sql.Int,productId)
        .query(`
          SELECT TOP 1 *
          FROM SharedListItems
          WHERE ListID = @ListID
          AND
          ProductID = @ProductID
        `);
        const listProduct = listProductResult.recordset[0];
        if(!listProduct)
        {
          throw new Error("The Item you scanned is not in the Linked shopping list.");
        }
        }
      

      const productResult = await new sql.Request(tx)
        .input("StoreID", sql.Int, order.StoreID)
        .input("ProductID", sql.Int, productId)
        .query(`
          SELECT TOP 1
            p.ProductID,
            p.ProductName,
            p.Company,
            p.ImageName,
            p.QRCode,
            CAST(
              si.Price * (1 - COALESCE(
                (SELECT MAX(ss.DiscountPercentage)
                 FROM StoreSales ss
                 WHERE ss.StoreID = si.StoreID AND ss.IsActive = 1
                 AND (ss.ApplyToAll = 1 OR EXISTS (SELECT 1 FROM StoreSaleCategories ssc WHERE ssc.SaleID = ss.SaleID AND ssc.CategoryID = p.CategoryID))
                ), 0) / 100.0)
            AS DECIMAL(10, 2)) AS Price,
            si.StockQty
          FROM Products p
          INNER JOIN StoreInventory si
            ON si.ProductID = p.ProductID
           AND si.StoreID = @StoreID
          WHERE p.ProductID = @ProductID
        `);

      const product = productResult.recordset[0];
      if (!product) {
        throw new Error("This product is not available in the current store.");
      }

      const existing = await new sql.Request(tx)
        .input("OrderID", sql.Int, orderId)
        .input("ProductID", sql.Int, productId)
        .query(`
          SELECT Quantity
          FROM OrderDetails
          WHERE OrderID = @OrderID
            AND ProductID = @ProductID
        `);

      const currentQuantity = toNumber(existing.recordset[0]?.Quantity);
      const nextQuantity = currentQuantity + quantity;
      const stockQty = toNumber(product.StockQty);

      if (nextQuantity > stockQty) {
        throw new Error(
          `Only ${stockQty} ${product.ProductName} item(s) are available in stock.`,
        );
      }

      if (existing.recordset.length) {
        if (nextQuantity <= 0) {
          await new sql.Request(tx)
            .input("OrderID", sql.Int, orderId)
            .input("ProductID", sql.Int, productId)
            .query(`
              DELETE FROM OrderDetails
              WHERE OrderID = @OrderID
                AND ProductID = @ProductID
            `);
        } else {
          await new sql.Request(tx)
            .input("OrderID", sql.Int, orderId)
            .input("ProductID", sql.Int, productId)
            .input("Quantity", sql.Int, nextQuantity)
            .input("PriceAtPurchase", sql.Decimal(10, 2), product.Price)
            .query(`
              UPDATE OrderDetails
              SET Quantity = @Quantity,
                  PriceAtPurchase = @PriceAtPurchase
              WHERE OrderID = @OrderID
                AND ProductID = @ProductID
            `);
        }
      } else if (quantity > 0) {
        await new sql.Request(tx)
          .input("OrderID", sql.Int, orderId)
          .input("ProductID", sql.Int, productId)
          .input("Quantity", sql.Int, quantity)
          .input("PriceAtPurchase", sql.Decimal(10, 2), product.Price)
          .query(`
            INSERT INTO OrderDetails (
              OrderID,
              ProductID,
              Quantity,
              PriceAtPurchase,
              Rating
            )
            VALUES (
              @OrderID,
              @ProductID,
              @Quantity,
              @PriceAtPurchase,
              NULL
            )
          `);
      }

      if (order.ListID) {
        const listRes = await new sql.Request(tx)
          .input("ListID", sql.Int, order.ListID)
          .input("ProductID", sql.Int, productId)
          .query(`
            SELECT Quantity FROM SharedListItems 
            WHERE ListID = @ListID AND ProductID = @ProductID
          `);

        if (listRes.recordset.length) {
          await new sql.Request(tx)
            .input("ListID", sql.Int, order.ListID)
            .input("ProductID", sql.Int, productId)
            .input("Quantity", sql.Decimal(10, 2), nextQuantity > 0 ? nextQuantity : 0)
            .query(`
              UPDATE SharedListItems
              SET IsPurchased = CASE
                WHEN @Quantity >= Quantity AND @Quantity > 0 THEN 1
                ELSE 0
              END
              WHERE ListID = @ListID
                AND ProductID = @ProductID
            `);
        } else if (nextQuantity > 0) {
          await new sql.Request(tx)
            .input("ListID", sql.Int, order.ListID)
            .input("ProductID", sql.Int, productId)
            .input("Quantity", sql.Decimal(10, 2), nextQuantity)
            .query(`
              INSERT INTO SharedListItems (ListID, ProductID, Quantity, IsPurchased, IsExtra)
              VALUES (@ListID, @ProductID, @Quantity, 1, 1)
            `);
        } else {
          // If nextQuantity is <= 0 and it was an extra item, we should probably delete it
          await new sql.Request(tx)
            .input("ListID", sql.Int, order.ListID)
            .input("ProductID", sql.Int, productId)
            .query(`
              DELETE FROM SharedListItems 
              WHERE ListID = @ListID AND ProductID = @ProductID AND IsExtra = 1
            `);
        }
      }

      await refreshOrderTotal(tx, orderId);
      await tx.commit();

      const items = await getOrderItems(conn, orderId);
      return items.find((item) => item.ProductID === productId) || null;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  scanItemToOrder: async ({ orderId, code, quantity = 1 }) => {
    const conn = await pool;
    const productResult = await conn.request()
      .input("QRCode", sql.NVarChar(100), code)
      .query(`
        SELECT TOP 1 ProductID
        FROM Products
        WHERE QRCode = @QRCode
      `);

    const product = productResult.recordset[0];
    if (!product) {
      throw new Error("No product matched this QR code or barcode.");
    }

    return OrderService.addItemToOrder({
      orderId,
      productId: product.ProductID,
      quantity,
    });
  },

  getOrderSessionItems: async (orderId) => {
    const conn = await pool;
    return getOrderItems(conn, orderId);
  },

  requestCheckout: async (orderId) => {
    const conn = await pool;

    const items = await getOrderItems(conn, orderId);
    if (!items.length) {
      throw new Error("Add at least one product before checkout.");
    }

    const result = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .input("InProgress", sql.NVarChar(30), ORDER_STATUS.inProgress)
      .input("PendingCheckout", sql.NVarChar(30), ORDER_STATUS.pendingCheckout)
      .query(`
        UPDATE Orders
        SET PaymentStatus = @PendingCheckout,
            CheckoutRequestedAt = GETDATE()
        WHERE OrderID = @OrderID
          AND PaymentStatus = @InProgress
      `);

    return result.rowsAffected[0] > 0;
  },

  confirmOrder: async (orderId, cashierId, loyaltyDiscountAmount = 0) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const orderCheckRes = await new sql.Request(tx)
        .input("OrderID", sql.Int, orderId)
        .input("PendingCheckout", sql.NVarChar(30), ORDER_STATUS.pendingCheckout)
        .query(`
          SELECT TOP 1 OrderID, TrolleyID, StoreID, ListID
          FROM Orders
          WHERE OrderID = @OrderID
            AND PaymentStatus = @PendingCheckout
        `);

      const order = orderCheckRes.recordset[0];
      if (!order) {
        throw new Error("Order is not in pending checkout state.");
      }

      const itemsResult = await new sql.Request(tx)
        .input("OrderID", sql.Int, orderId)
        .input("StoreID", sql.Int, order.StoreID)
        .query(`
          SELECT
            od.ProductID,
            od.Quantity,
            p.ProductName,
            si.StockQty
          FROM OrderDetails od
          INNER JOIN Products p ON p.ProductID = od.ProductID
          INNER JOIN StoreInventory si WITH (UPDLOCK, HOLDLOCK)
            ON si.ProductID = od.ProductID
           AND si.StoreID = @StoreID
          WHERE od.OrderID = @OrderID
        `);

      const items = itemsResult.recordset;
      if (!items.length) {
        throw new Error("This checkout request has no items.");
      }

      const insufficient = items.find(
        (item) => toNumber(item.StockQty) < toNumber(item.Quantity),
      );

      if (insufficient) {
        throw new Error(
          `${insufficient.ProductName} has only ${insufficient.StockQty} item(s) left in stock.`,
        );
      }

      for (const item of items) {
        await new sql.Request(tx)
          .input("StoreID", sql.Int, order.StoreID)
          .input("ProductID", sql.Int, item.ProductID)
          .input("Quantity", sql.Int, item.Quantity)
          .query(`
            UPDATE StoreInventory
            SET StockQty = StockQty - @Quantity
            WHERE StoreID = @StoreID
              AND ProductID = @ProductID
          `);
      }

      await refreshOrderTotal(tx, orderId);

      const discountValue = parseFloat(loyaltyDiscountAmount) || 0;

      await new sql.Request(tx)
        .input("OrderID", sql.Int, orderId)
        .input("CashierID", sql.Int, cashierId || null)
        .input("Completed", sql.NVarChar(30), ORDER_STATUS.completed)
        .input("LoyaltyDiscountAmount", sql.Decimal(10, 2), discountValue)
        .query(`
          UPDATE Orders
          SET PaymentStatus = @Completed,
              CashierID = @CashierID,
              CompletedAt = GETDATE(),
              LoyaltyDiscountAmount = @LoyaltyDiscountAmount,
              TotalAmount = CASE 
                WHEN TotalAmount - @LoyaltyDiscountAmount < 0 THEN 0 
                ELSE TotalAmount - @LoyaltyDiscountAmount 
              END
          WHERE OrderID = @OrderID
        `);

      if (order.TrolleyID) {
        await new sql.Request(tx)
          .input("TrolleyID", sql.Int, order.TrolleyID)
          .query(`
            UPDATE Trolley
            SET Status = 'Available'
            WHERE TrolleyID = @TrolleyID
          `);
      }

      if (order.ListID) {
        await new sql.Request(tx)
          .input("ListID", sql.Int, order.ListID)
          .query(`
            UPDATE SharedList
            SET Status = 'Completed'
            WHERE ListID = @ListID;

            UPDATE SharedListItems
            SET IsPurchased = 1
            WHERE ListID = @ListID;
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
      .input("InProgress", sql.NVarChar(30), ORDER_STATUS.inProgress)
      .query(`
        ${orderSummarySelect}
        WHERE o.StoreID = @StoreID
          AND o.PaymentStatus = @InProgress
        ORDER BY o.OrderDate DESC
      `);

    return result.recordset.map((order) => summarizeOrder(order));
  },

  getCheckoutRequests: async (storeId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("StoreID", sql.Int, storeId)
      .input("PendingCheckout", sql.NVarChar(30), ORDER_STATUS.pendingCheckout)
      .input("Completed", sql.NVarChar(30), ORDER_STATUS.completed)
      .query(`
        SELECT 
          sub.*,
          CASE WHEN lastOrder.OrderID IS NOT NULL THEN 1 ELSE 0 END AS EligibleForLoyalty,
          ISNULL(lastOrder.TotalAmount, 0) AS LastOrderAmount
        FROM (
          ${orderSummarySelect}
          WHERE o.StoreID = @StoreID
            AND o.PaymentStatus = @PendingCheckout
        ) sub
        OUTER APPLY (
          SELECT TOP 1 TotalAmount, OrderID
          FROM Orders
          WHERE CustomerID = sub.CustomerID
            AND PaymentStatus = @Completed
            AND OrderDate >= DATEADD(day, -30, GETDATE())
          ORDER BY OrderDate DESC
        ) lastOrder
        ORDER BY ISNULL(sub.CheckoutRequestedAt, sub.OrderDate) ASC
      `);

    return result.recordset.map((order) => {
      const summary = summarizeOrder(order, true);
      summary.EligibleForLoyalty = order.EligibleForLoyalty === 1;
      summary.LastOrderAmount = toNumber(order.LastOrderAmount);
      return summary;
    });
  },

  getCustomerPastOrders: async (customerId) => {
    const conn = await pool;
    const result = await conn.request()
      .input("CustomerID", sql.Int, customerId)
      .input("Completed", sql.NVarChar(30), ORDER_STATUS.completed)
      .query(`
        SELECT
          o.OrderID,
          o.OrderDate,
          o.TotalAmount,
          o.StoreID,
          s.StoreName,
          s.StoreAddress,
          ISNULL((
            SELECT SUM(od.Quantity)
            FROM OrderDetails od
            WHERE od.OrderID = o.OrderID
          ), 0) AS ItemsCount
        FROM Orders o
        LEFT JOIN Store s ON s.StoreID = o.StoreID
        WHERE o.CustomerID = @CustomerID
          AND o.PaymentStatus = @Completed
        ORDER BY o.OrderDate DESC
      `);
    return result.recordset;
  },

  getReorderDetails: async (orderId) => {
    const conn = await pool;

    const orderRes = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .query(`SELECT OrderID, StoreID, CustomerID FROM Orders WHERE OrderID = @OrderID`);

    const order = orderRes.recordset[0];
    if (!order) throw new Error("Order not found.");

    const itemsRes = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .input("StoreID", sql.Int, order.StoreID)
      .query(`
        SELECT
          od.ProductID,
          od.Quantity,
          od.PriceAtPurchase AS OldPrice,
          ISNULL(
            CAST(si.Price * (1 - COALESCE(
              (SELECT MAX(ss.DiscountPercentage)
               FROM StoreSales ss
               WHERE ss.StoreID = si.StoreID AND ss.IsActive = 1
               AND (ss.ApplyToAll = 1 OR EXISTS (SELECT 1 FROM StoreSaleCategories ssc WHERE ssc.SaleID = ss.SaleID AND ssc.CategoryID = p.CategoryID))
              ), 0) / 100.0) AS DECIMAL(10, 2)), 
            od.PriceAtPurchase
          ) AS CurrentPrice,
          ISNULL(si.StockQty, 0) AS StockQty,
          p.ProductName,
          p.Company,
          p.ImageName
        FROM OrderDetails od
        INNER JOIN Products p ON p.ProductID = od.ProductID
        LEFT JOIN StoreInventory si
          ON si.ProductID = od.ProductID
         AND si.StoreID = @StoreID
        WHERE od.OrderID = @OrderID
        ORDER BY p.ProductName
      `);

    return {
      orderId: order.OrderID,
      storeId: order.StoreID,
      customerId: order.CustomerID,
      items: itemsRes.recordset,
    };
  },

  submitReorder: async ({ customerId, storeId, originalOrderId, items }) => {
    const conn = await pool;
    const tx = new sql.Transaction(conn);
    await tx.begin();

    try {
      const totalAmount = items.reduce(
        (sum, item) => sum + toNumber(item.currentPrice) * toNumber(item.quantity),
        0
      );

      const orderRes = await new sql.Request(tx)
        .input("OrderDate", sql.DateTime, new Date())
        .input("TotalAmount", sql.Decimal(10, 2), totalAmount)
        .input("PaymentStatus", sql.NVarChar(30), ORDER_STATUS.pendingCheckout)
        .input("CustomerID", sql.Int, customerId)
        .input("StoreID", sql.Int, storeId)
        .input("CheckoutRequestedAt", sql.DateTime, new Date())
        .query(`
          INSERT INTO Orders (
            OrderDate, TotalAmount, PaymentStatus,
            CustomerID, StoreID, CheckoutRequestedAt
          )
          VALUES (
            @OrderDate, @TotalAmount, @PaymentStatus,
            @CustomerID, @StoreID, @CheckoutRequestedAt
          );
          SELECT SCOPE_IDENTITY() AS OrderID;
        `);

      const newOrderId = orderRes.recordset[0].OrderID;

      for (const item of items) {
        await new sql.Request(tx)
          .input("OrderID", sql.Int, newOrderId)
          .input("ProductID", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .input("PriceAtPurchase", sql.Decimal(10, 2), item.currentPrice)
          .query(`
            INSERT INTO OrderDetails (OrderID, ProductID, Quantity, PriceAtPurchase, Rating)
            VALUES (@OrderID, @ProductID, @Quantity, @PriceAtPurchase, NULL)
          `);
      }

      await tx.commit();
      return newOrderId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  getSessionList: async (orderId) => {
    const conn = await pool;

    const orderRes = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .query(`SELECT ListID, StoreID FROM Orders WHERE OrderID = @OrderID`);

    if (!orderRes.recordset.length) {
      throw new Error("Order not found");
    }

    const { ListID, StoreID } = orderRes.recordset[0];
    if (!ListID) {
      return null;
    }

    const listRes = await conn.request()
      .input("ListID", sql.Int, ListID)
      .query(`
        SELECT ListID, ListName, Status, StoreID, Budget
        FROM SharedList
        WHERE ListID = @ListID
      `);

    if (!listRes.recordset.length) {
      return null;
    }

    const list = listRes.recordset[0];

    const itemsRes = await conn.request()
      .input("ListID", sql.Int, ListID)
      .input("StoreID", sql.Int, StoreID || list.StoreID)
      .query(`
        SELECT
          sli.ListID,
          sli.ProductID,
          sli.Quantity,
          sli.IsPurchased,
          p.ProductName,
          p.ImageName AS ProductImage,
          p.Company,
          p.QRCode,
          COALESCE(
            CAST(si.Price * (1 - COALESCE(
              (SELECT MAX(ss.DiscountPercentage)
               FROM StoreSales ss
               WHERE ss.StoreID = si.StoreID AND ss.IsActive = 1
               AND (ss.ApplyToAll = 1 OR EXISTS (SELECT 1 FROM StoreSaleCategories ssc WHERE ssc.SaleID = ss.SaleID AND ssc.CategoryID = p.CategoryID))
              ), 0) / 100.0) AS DECIMAL(10, 2)), 
            0
          ) AS Price,
          COALESCE(si.StockQty, 0) AS StockQty
        FROM SharedListItems sli
        JOIN Products p ON p.ProductID = sli.ProductID
        LEFT JOIN StoreInventory si
          ON si.ProductID = sli.ProductID
         AND si.StoreID = @StoreID
        WHERE sli.ListID = @ListID
        ORDER BY p.ProductName
      `);

    return {
      listId: list.ListID,
      listName: list.ListName,
      status: list.Status,
      budget: list.Budget,
      items: itemsRes.recordset,
    };
  },

  // AI Vision Sync: match detected product names to DB, then SET quantities in OrderDetails
  syncDetectedItems: async (orderId, detections) => {
    const conn = await pool;

    // Fetch the order to get StoreID and validate status
    const orderRes = await conn.request()
      .input("OrderID", sql.Int, orderId)
      .query(`
        SELECT OrderID, StoreID, PaymentStatus
        FROM Orders
        WHERE OrderID = @OrderID
      `);

    const order = orderRes.recordset[0];
    if (!order) throw new Error("Order not found.");
    if (order.PaymentStatus !== "InProgress") {
      throw new Error("Session is not open for modification.");
    }

    const tx = new sql.Transaction(conn);
    await tx.begin();

    const syncResults = [];

    try {
      for (const detection of detections) {
        const { name, count } = detection;

        if (!name || !count || count <= 0) continue;

        // Find product by exact name in Products table
        const productRes = await new sql.Request(tx)
          .input("ProductName", sql.NVarChar(150), name)
          .query(`
            SELECT TOP 1 p.ProductID
            FROM Products p
            WHERE p.ProductName = @ProductName
          `);

        const product = productRes.recordset[0];
        if (!product) {
          syncResults.push({ name, status: "not_found", count });
          continue;
        }

        // Check product is in StoreInventory
        const inventoryRes = await new sql.Request(tx)
          .input("ProductID", sql.Int, product.ProductID)
          .input("StoreID", sql.Int, order.StoreID)
          .query(`
            SELECT 
              CAST(si.Price * (1 - COALESCE(
                (SELECT MAX(ss.DiscountPercentage)
                 FROM StoreSales ss
                 WHERE ss.StoreID = si.StoreID AND ss.IsActive = 1
                 AND (ss.ApplyToAll = 1 OR EXISTS (SELECT 1 FROM StoreSaleCategories ssc WHERE ssc.SaleID = ss.SaleID AND ssc.CategoryID = p.CategoryID))
                ), 0) / 100.0) AS DECIMAL(10, 2)) AS Price,
              si.StockQty
            FROM StoreInventory si
            INNER JOIN Products p ON si.ProductID = p.ProductID
            WHERE si.ProductID = @ProductID AND si.StoreID = @StoreID
          `);

        const inventory = inventoryRes.recordset[0];
        if (!inventory) {
          syncResults.push({ name, status: "not_in_store", count });
          continue;
        }

        // Cap count to available stock
        const syncQty = Math.min(count, toNumber(inventory.StockQty));

        // Check if already in OrderDetails
        const existingRes = await new sql.Request(tx)
          .input("OrderID", sql.Int, orderId)
          .input("ProductID", sql.Int, product.ProductID)
          .query(`
            SELECT Quantity FROM OrderDetails
            WHERE OrderID = @OrderID AND ProductID = @ProductID
          `);

        if (existingRes.recordset.length > 0) {
          // UPDATE quantity to detected count
          await new sql.Request(tx)
            .input("OrderID", sql.Int, orderId)
            .input("ProductID", sql.Int, product.ProductID)
            .input("Quantity", sql.Int, syncQty)
            .input("Price", sql.Decimal(10, 2), inventory.Price)
            .query(`
              UPDATE OrderDetails
              SET Quantity = @Quantity, PriceAtPurchase = @Price
              WHERE OrderID = @OrderID AND ProductID = @ProductID
            `);
          syncResults.push({ name, status: "updated", count: syncQty });
        } else {
          // INSERT new item from AI detection
          await new sql.Request(tx)
            .input("OrderID", sql.Int, orderId)
            .input("ProductID", sql.Int, product.ProductID)
            .input("Quantity", sql.Int, syncQty)
            .input("Price", sql.Decimal(10, 2), inventory.Price)
            .query(`
              INSERT INTO OrderDetails (OrderID, ProductID, Quantity, PriceAtPurchase, Rating)
              VALUES (@OrderID, @ProductID, @Quantity, @Price, NULL)
            `);
          syncResults.push({ name, status: "added", count: syncQty });
        }
      }

      await refreshOrderTotal(tx, orderId);
      await tx.commit();

      const updatedItems = await getOrderItems(conn, orderId);
      return { syncResults, updatedItems };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },
};
