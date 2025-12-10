// src/validator/sharedListValidator.js
import { check } from "express-validator";

export const validateSharedList = [
  check("receiverCustomerId").isInt(),
  check("items").isArray({ min: 1 }),
  check("items.*.productId").isInt(),
  check("items.*.quantity").isInt({ min: 1 })
];
