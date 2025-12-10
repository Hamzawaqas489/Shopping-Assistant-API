// src/validator/productValidator.js
import { check } from "express-validator";

export const validateProduct = [
  check("productName").notEmpty().withMessage("Product name is required"),
  check("categoryId").isInt().withMessage("categoryId is required")
];
