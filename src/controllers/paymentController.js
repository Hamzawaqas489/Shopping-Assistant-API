// src/controllers/paymentController.js
import { PaymentService } from "../services/paymentService.js";

export const PaymentController = {
  create: async (req, res) => {
    try {
      const id = await PaymentService.createRequest(req.body);
      return res.status(201).json({ status: true, paymentId: id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  listPending: async (req, res) => {
    try {
      const list = await PaymentService.listPending();
      return res.status(200).json({ status: true, data: list });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const updated = await PaymentService.updateStatus(parseInt(req.params.paymentId), req.body.status);
      if (updated > 0) return res.status(200).json({ status: true, message: "Updated" });
      return res.status(404).json({ status: false, message: "Not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
