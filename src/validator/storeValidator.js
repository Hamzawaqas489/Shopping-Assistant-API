// src/validator/storeValidator.js
import { check } from "express-validator";

export const validateStore = [
  check("storeName").notEmpty()
  .withMessage("Store name is required")
  .isLength({ min: 2 })
  .withMessage("Store name length must be of two letters.")
];
