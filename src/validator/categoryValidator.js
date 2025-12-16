import { body, param } from "express-validator";


export const validateCategory = [
  body("categoryName")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters")
];

