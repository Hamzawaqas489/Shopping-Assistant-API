// src/validator/userValidator.js
import { check } from "express-validator";

export const validateUser = [
  
  check("name")
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2 to 100 characters long"),

  
  check("phone")
    .notEmpty().withMessage("Phone is required")
    .matches(/^[0-9]{10,15}$/).withMessage("Phone must be 10 to 15 digits"),

  
  check("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Email must be valid"),

  
  check("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  
  check("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["Admin", "Cashier", "Customer"]).withMessage("Role must be Admin, Cashier, or Customer"),

  
  check("profilePicName")
    .optional()
    .isString().withMessage("ProfilePicName must be a string"),

  
  check("storeID")
    .optional()
    .isInt({ min: 1 }).withMessage("StoreID must be a valid integer")
];
