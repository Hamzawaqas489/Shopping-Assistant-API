// src/controllers/orderController.js
import { OrderService } from "../services/orderService.js";

export const OrderController = {
  create: async (req, res) => {
    try {
      const id = await OrderService.create(req.body);
      return res.status(201).json({ status: true, orderId: id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error creating order", error: err.message });
    }
  },

  listByCustomer: async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const orders = await OrderService.getByCustomer(customerId);
      return res.status(200).json({ status: true, data: orders });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  details: async (req, res) => {
    try {
      const info = await OrderService.getDetails(parseInt(req.params.orderId));
      if (!info.order) return res.status(404).json({ status: false, message: "Order not found" });
      return res.status(200).json({ status: true, data: info });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const updated = await OrderService.updateStatus(parseInt(req.params.orderId), req.body.status);
      if (updated > 0) return res.status(200).json({ status: true, message: "Order updated" });
      return res.status(404).json({ status: false, message: "Order not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
