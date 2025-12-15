// src/controllers/orderController.js
import { OrderService } from "../services/orderService.js";

export const OrderController = {

  place: async (req, res) => {
    try {
      const orderId = await OrderService.placeOrder(req.body);
      return res.status(201).json({
        status: true,
        message: "Order placed successfully",
        orderId
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  }
};
