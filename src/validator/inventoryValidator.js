// src/validator/inventoryValidator.js
import { check } from "express-validator";

export const validateInventory = [
  check("storeId").isInt().withMessage("storeId is required"),
  check("productId").isInt().withMessage("productId is required"),
  check("price").isFloat().withMessage("price is required"),
  check("stockQty").optional().isInt()
];
