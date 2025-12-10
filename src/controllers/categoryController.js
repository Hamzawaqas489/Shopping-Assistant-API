// src/controllers/categoryController.js
import { CategoryService } from "../services/categoryService.js";

export const CategoryController = {
  listByStore: async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const cats = await CategoryService.getByStore(storeId);
      return res.status(200).json({ status: true, data: cats });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error fetching categories", error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const id = await CategoryService.create(req.body);
      return res.status(201).json({ status: true, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error creating category", error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await CategoryService.remove(req.params.id);
      if (removed > 0) return res.status(200).json({ status: true, message: "Category removed" });
      return res.status(404).json({ status: false, message: "Category not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
