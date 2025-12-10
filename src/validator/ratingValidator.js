// src/validator/ratingValidator.js
import { check } from "express-validator";

export const validateRating = [
  check("productId").isInt(),
  check("value").isInt({ min: 1, max: 5 }),
  check("reviewText").optional().isString()
];
