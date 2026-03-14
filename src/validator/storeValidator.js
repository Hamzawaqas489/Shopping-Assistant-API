// src/validator/storeValidator.js
import { check } from "express-validator";

export const validateStore = [
  check("StoreName").notEmpty()
  .withMessage("Store name is required")
  .isLength({ min: 3 })
  .withMessage("Store name must be at least 3 characters."),
  check("StoreAddress").notEmpty()
  .withMessage("Store address is required")
  .isLength({ min: 5 })
  .withMessage("Store address must be at least 5 characters.")
];
