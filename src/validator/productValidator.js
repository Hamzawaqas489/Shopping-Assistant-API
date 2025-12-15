// src/validator/productValidator.js
import { check } from "express-validator";

export const validateProduct = [
  check("productName")
    .notEmpty().withMessage("Product name is required"),

  check("categoryId")
    .isInt({ gt: 0 }).withMessage("Valid categoryId is required"),

  check("uomId")
    .isInt({ gt: 0 }).withMessage("Valid UOM is required"),

  check("variant")
    .optional()
    .isLength({ max: 50 }).withMessage("Variant too long"),

  check("price")
    .isFloat({ gt: 0 }).withMessage("Valid price is required"),

  check("stockQty")
    .isInt({ min: 0 }).withMessage("Stock quantity must be >= 0"),

  check("storeId")
    .isInt({ gt: 0 }).withMessage("StoreID is required")
];
