// src/validator/orderValidator.js
import { check } from "express-validator";

export const validateOrder = [
  check("customerId").isInt().withMessage("customerId is required"),
  check("items").isArray({ min: 1 }).withMessage("items array required"),
  check("items.*.productId").isInt(),
  check("items.*.quantity").isInt({ min: 1 }),
  check("items.*.priceAtPurchase").isFloat()
];
