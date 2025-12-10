// src/controllers/productController.js
import { ProductService } from "../services/productService.js";

export const ProductController = {
  listByCategory: async (req, res) => {
    try {
      const products = await ProductService.getByCategory(parseInt(req.params.categoryId));
      return res.status(200).json({ status: true, data: products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error fetching products", error: err.message });
    }
  },

  details: async (req, res) => {
    try {
      const product = await ProductService.getById(parseInt(req.params.id));
      if (!product) return res.status(404).json({ status: false, message: "Product not found" });
      return res.status(200).json({ status: true, data: product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error fetching product", error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const id = await ProductService.create(req.body);
      return res.status(201).json({ status: true, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error creating product", error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await ProductService.update(req.params.id, req.body);
      if (updated > 0) return res.status(200).json({ status: true, message: "Product updated" });
      return res.status(404).json({ status: false, message: "Product not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error updating product", error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await ProductService.remove(req.params.id);
      if (removed > 0) return res.status(200).json({ status: true, message: "Product removed" });
      return res.status(404).json({ status: false, message: "Product not found" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error removing product", error: err.message });
    }
  }
};
