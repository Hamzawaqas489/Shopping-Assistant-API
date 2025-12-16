// src/validator/storeValidator.js
import { check } from "express-validator";

export const validateStore = [
  check("storeName").notEmpty()
  .withMessage("Store name is required")
  .isLength({ min: 3 })
  .withMessage("Store name length must be of Three letters.")
];
