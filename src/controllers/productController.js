// src/controllers/productController.js
import { ProductService } from "../services/productService.js";

export const ProductController = {

  addBulkProducts: async (req, res) => {
    try {
      const { StoreID, Products } = req.body;

      if (!StoreID || !Array.isArray(Products) || Products.length === 0) {
        return res.status(400).json({
          status: false,
          message: "StoreID and Products array are required"
        });
      }

      const result = await ProductService.addBulkProducts(StoreID, Products);

      return res.status(201).json({
        status: true,
        message: "Inventory updated successfully",
        inserted: result.inserted,
        updated: result.updated
      });

    } catch (err) {
      console.error("Bulk inventory error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to update inventory",
        error: err.message
      });
    }
  },

  getStoreProducts: async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);

      if (!storeId) {
        return res.status(400).json({
          status: false,
          message: "Invalid store id"
        });
      }

      const products = await ProductService.getStoreProducts(storeId);

      return res.status(200).json({
        status: true,
        data: products
      });

    } catch (err) {
      console.error("Get store products error:", err);

      return res.status(500).json({
        status: false,
        message: "Failed to fetch store products",
        error: err.message
      });
    }
  },

  updateStoreProduct : async (req, res) => {
  try {
    const { StoreID, ProductID, Price, StockQty } = req.body;


    const updated = await ProductService.updateStoreProduct({
      StoreID,
      ProductID,
      Price,
      StockQty
    });

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "Product not found in inventory",
      });
    }

    return res.json({
      status: true,
      message: "Product updated successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    }
    );  }
},


  // List products by category and store
  listByCategory: async (req, res) => {
    try {
      const { CategoryId} = req.params;

      const products = await ProductService.getByCategory(
        parseInt(CategoryId),
      );

      return res.status(200).json({
        status: true,
        message: "Products fetched successfully.",
        data: products
      });

    } catch (err) {
      console.error("List products error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch products",
        error: err.message
      });
    }
  },

  // Get product details by ID
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
        error: err.message
      });
    }
  },

  // Create a new product
  create: async (req, res) => {
    try {
      if (req.file) {
        // Save image path
        req.body.ImageName = req.file ? req.file.filename : null;
      }

      const productId = await ProductService.create(req.body);

      return res.status(201).json({
        status: true,
        message: "Product created successfully",
        data: productId
      });

    } catch (err) {
      console.error("Create product error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to create product"
      });
    }
  },

  // Update existing product
  update: async (req, res) => {
    try {
      if (req.file) {
        req.body.imageUrl = `uploads/products/${req.file.filename}`;
      }

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

  // Delete product
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
