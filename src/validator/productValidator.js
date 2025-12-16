// src/validator/productValidator.js
import { check } from "express-validator";

export const validateProduct = [

  // Product Name
  check("productName")
    .notEmpty().withMessage("Product name is required")
    .isLength({ min: 2, max: 150 }).withMessage("Product name must be 2–150 characters"),

  // Company
  check("company")
    .notEmpty().withMessage("Company name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Company name must be 2–100 characters"),

  // Expiry Date
  check("expiryDate")
    .notEmpty().withMessage("Expiry date is required")
    .isISO8601().withMessage("Expiry date must be a valid date"),

  // Image Name (set by multer, optional in request body)
  check("imageName")
    .optional()
    .isString().withMessage("Image name must be a string"),

  // Category ID
  check("categoryID")
    .isInt({ gt: 0 }).withMessage("Valid categoryID is required"),

  // Attribute Name (e.g., Weight, Size)
  check("attName")
    .notEmpty().withMessage("Attribute name is required")
    .isLength({ min: 1, max: 50 }).withMessage("Attribute name must be valid"),

  // Attribute Value (e.g., 500 ml, 1 kg)
  check("attValue")
    .notEmpty().withMessage("Attribute value is required")
    .isLength({ min: 1, max: 50 }).withMessage("Attribute value must be valid"),

  // Store ID
  check("storeId")
    .isInt({ gt: 0 }).withMessage("Valid storeId is required"),

  // Stock Quantity
  check("stockQty")
    .isInt({ min: 0 }).withMessage("Stock quantity must be 0 or greater"),

  // Price
  check("price")
    .isFloat({ gt: 0 }).withMessage("Valid price is required")
];
