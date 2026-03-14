// src/validator/userValidator.js
import { check } from "express-validator";

export const validateUser = [
  
  check("Name")
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2 to 100 characters long"),

  check("Phone")
    .notEmpty().withMessage("Phone is required")
    .matches(/^[0-9]{10,15}$/).withMessage("Phone must be 10 to 15 digits"),

  check("Email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Email must be valid"),

  check("Role")
    .notEmpty().withMessage("Role is required")
    .isIn(["Admin", "Cashier", "Customer", "cashier", "admin"]).withMessage("Role is invalid"),

  check("ProfilePicName")
    .optional()
    .isString().withMessage("ProfilePicName must be a string"),

  check("StoreID")
    .optional()
    .isInt({ min: 1 }).withMessage("StoreID must be a valid integer")
];
