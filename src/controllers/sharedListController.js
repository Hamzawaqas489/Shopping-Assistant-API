// src/controllers/sharedListController.js
import { SharedListService } from "../services/sharedListService.js";

export const SharedListController = {
  create: async (req, res) => {
    try {
      const payload = { ...req.body, senderCustomerId: req.user.id };
      const id = await SharedListService.create(payload);
      return res.status(201).json({ status: true, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  received: async (req, res) => {
    try {
      const lists = await SharedListService.getReceived(req.user.id);
      return res.status(200).json({ status: true, data: lists });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  details: async (req, res) => {
    try {
      const info = await SharedListService.getDetails(parseInt(req.params.listId));
      return res.status(200).json({ status: true, data: info });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const updated = await SharedListService.updateStatus(parseInt(req.params.listId), req.body.status);
      if (updated > 0) return res.status(200).json({ status: true, message: "Updated" });
      return res.status(404).json({ status: false, message: "Not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
