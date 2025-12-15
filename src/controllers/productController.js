// src/controllers/productController.js
import { ProductService } from "../services/productService.js";

export const ProductController = {

  listByCategory: async (req, res) => {
    try {
      const { categoryId, storeId } = req.query;

      const products = await ProductService.getByCategory(
        parseInt(categoryId),
        parseInt(storeId)
      );

      return res.status(200).json({
        status: true,
        message: "Products Fetched Successfully.",
        data: products
      });

    } catch (err) {
      console.error("List products error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch products",
        orror:err.message
      });
    }
  },

  details: async (req, res) => {
    try {
      const product = await ProductService.getById(parseInt(req.params.id));

      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Product details fetched successfully.",
        data: product
      });

    } catch (err) {
      console.error("Product details error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch product",
        error:err.message
      });
    }
  },

  create: async (req, res) => {
    try {
      const productId = await ProductService.create(req.body);

      return res.status(201).json({
        status: true,
        message: "Product created successfully",
        data:productId
      });

    } catch (err) {
      console.error("Create product error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to create product"
      });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await ProductService.update(
        parseInt(req.params.id),
        req.body
      );

      if (!updated) {
        return res.status(404).json({
          status: false,
          message: "Product not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Product updated successfully"
      });

    } catch (err) {
      console.error("Update product error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to update product"
      });
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await ProductService.remove(parseInt(req.params.id));

      if (!removed) {
        return res.status(404).json({
          status: false,
          message: "Product not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Product deleted successfully"
      });

    } catch (err) {
      console.error("Delete product error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to delete product"
      });
    }
  }
};
