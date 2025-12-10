// src/controllers/inventoryController.js
import { InventoryService } from "../services/inventoryService.js";

export const InventoryController = {
  assign: async (req, res) => {
    try {
      const affected = await InventoryService.assignProduct(req.body);
      return res.status(200).json({ status: true, affected });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error assigning product", error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await InventoryService.remove(parseInt(req.params.storeId), parseInt(req.params.productId));
      if (removed > 0) return res.status(200).json({ status: true, message: "Removed" });
      return res.status(404).json({ status: false, message: "Not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  listByStore: async (req, res) => {
    try {
      const data = await InventoryService.getStoreProducts(parseInt(req.params.storeId));
      return res.status(200).json({ status: true, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
