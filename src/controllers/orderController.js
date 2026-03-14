import { OrderService } from "../services/orderService.js";

export const OrderController = {
  // List all orders
  list: async (req, res) => {
    const orders = await OrderService.getAll();
    res.json({ status: true, data: orders });
  },

  // Get order details
  details: async (req, res) => {
    const order = await OrderService.getById(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ status: false, message: "Order not found" });
    }
    res.json({ status: true, data: order });
  },

  // Update payment status
  updateStatus: async (req, res) => {
    const updated = await OrderService.updatePaymentStatus(
      parseInt(req.params.id),
      req.body.paymentStatus
    );

    if (!updated) {
      return res.status(404).json({ status: false, message: "Order not found" });
    }

    res.json({ status: true, message: "Payment status updated" });
  },

  // Delete order
  remove: async (req, res) => {
    const deleted = await OrderService.remove(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ status: false, message: "Order not found" });
    }
    res.json({ status: true, message: "Order deleted successfully" });
  },

  // Rate product
  rateProduct: async (req, res) => {
    try {
      await OrderService.rateProduct({
        orderId: parseInt(req.params.orderId),
        productId: parseInt(req.params.productId),
        customerId: req.user.userId, // from JWT
        rating: req.body.rating
      });

      return res.json({
        status: true,
        message: "Product rated successfully"
      });

    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  // Create order with details
  createWithDetails: async (req, res) => {
    const items =  JSON.parse(req.body.items);
    try {
      const orderId = await OrderService.createWithDetails({
        orderDate: req.body.orderDate,
        paymentStatus: req.body.paymentStatus,
        trolleyId: parseInt(req.body.trolleyId),
        customerId: parseInt(req.body.customerId),
        cashierId: parseInt(req.body.cashierId),
        items // multipart JSON
      });

      return res.status(201).json({
        status: true,
        message: "Order created successfully",
        orderId
      });

    } catch (err) {
      console.error("Create order error:", err);
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  // --- NEW: Shopping Session (Trolley) mapping endpoints ---
  startShoppingSession: async (req, res) => {
    try {
      const { trolleyId, customerId, listId, storeId } = req.body;
      const orderId = await OrderService.startShoppingSession({
        trolleyId: parseInt(trolleyId),
        customerId: parseInt(customerId),
        listId: listId ? parseInt(listId) : null,
        storeId: storeId ? parseInt(storeId) : null,
      });

      res.status(201).json({ status: true, orderId, message: "Shopping session started." });
    } catch (err) {
      res.status(400).json({ status: false, message: err.message });
    }
  },

  addItemToOrder: async (req, res) => {
    try {
      const { orderId, productId, quantity } = req.body;
      const result = await OrderService.addItemToOrder({
        orderId: parseInt(orderId),
        productId: parseInt(productId),
        quantity: quantity ? parseInt(quantity) : 1
      });

      res.json({ status: true, message: "Item added to cart.", data: result });
    } catch (err) {
      res.status(400).json({ status: false, message: err.message });
    }
  },

  getOrderSessionItems: async (req, res) => {
    try {
      const items = await OrderService.getOrderSessionItems(parseInt(req.params.id));
      res.json({ status: true, data: items });
    } catch (err) {
      res.status(400).json({ status: false, message: err.message });
    }
  },

  requestCheckout: async (req, res) => {
    try {
      const success = await OrderService.requestCheckout(parseInt(req.params.id));
      if (!success) {
         return res.status(404).json({ status: false, message: "Order not found" });
      }
      res.json({ status: true, message: "Checkout requested successfully!" });
    } catch(err) {
      res.status(400).json({ status: false, message: err.message });
    }
  },

  confirmOrder: async (req, res) => {
    try {
      const cashierId = req.user ? req.user.userId : 1; // Basic fallback if no auth
      await OrderService.confirmOrder(parseInt(req.params.id), cashierId);
      res.json({ status: true, message: "Order confirmed successfully!" });
    } catch(err) {
      res.status(400).json({ status: false, message: err.message });
    }
  },

  getActiveTrolleys: async (req, res) => {
    try {
       const storeId = parseInt(req.params.storeId);
       const data = await OrderService.getActiveTrolleys(storeId);
       res.json({ status: true, data });
    } catch (err) {
       res.status(400).json({ status: false, message: err.message });
    }
  },

  getCheckoutRequests: async (req, res) => {
    try {
       const storeId = parseInt(req.params.storeId);
       const data = await OrderService.getCheckoutRequests(storeId);
       res.json({ status: true, data });
    } catch (err) {
       res.status(400).json({ status: false, message: err.message });
    }
  },

  getSessionList: async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const data = await OrderService.getSessionList(orderId);
      res.json({ status: true, data });
    } catch (err) {
      res.status(400).json({ status: false, message: err.message });
    }
  }
};
