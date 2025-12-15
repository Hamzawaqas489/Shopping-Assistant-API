// src/validator/orderValidator.js
import { check } from "express-validator";

export const validateOrder = [
  check("customerId").isInt(),
  check("trolleyId").isInt(),
  check("items").isArray({ min: 1 }),
  check("items.*.productId").isInt(),
  check("items.*.quantity").isInt({ min: 1 })
];
