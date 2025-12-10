// src/controllers/storeController.js
import { StoreService } from "../services/storeService.js";

export const StoreController = {
  list: async (req, res) => {
    try {
      const stores = await StoreService.getAll();
      return res.status(200).json({
         status: true,
         message:"All stores fetched successfully.",
         data: stores
         });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error fetching stores", error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const id = await StoreService.create(req.body);
      if (id) return res.status(201).json({ status: true, message: "Store created", data:id });
      return res.status(400).json({ status: false, message: "Store not created" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error creating store", error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await StoreService.update(req.params.id, req.body);
      if (updated > 0) return res.status(200).json({ status: true, message: "Store updated" });
      return res.status(404).json({ status: false, message: "Store not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error updating store", error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await StoreService.remove(req.params.id);
      if (removed > 0) return res.status(200).json({ status: true, message: "Store removed" });
      return res.status(404).json({ status: false, message: "Store not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error removing store", error: err.message });
    }
  }
};
