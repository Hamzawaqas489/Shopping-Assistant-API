// src/validator/categoryValidator.js
import { check } from "express-validator";

export const validateCategory = [
  check("categoryName").notEmpty().withMessage("Category name is required"),
  check("storeId").isInt().withMessage("storeId is required")
];
