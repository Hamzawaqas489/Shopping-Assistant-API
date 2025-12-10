// src/validator/authValidator.js
import { check } from "express-validator";

export const validateSignUp = [
  check("name").notEmpty().withMessage("Name is required").isLength({ min: 3 }).withMessage("Name must be 3+ characters"),
  check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Email is not valid"),
  check("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be 6+ characters"),
  check("phone").notEmpty().withMessage("Phone is required").isLength({ min: 7, max: 20 }).withMessage("Phone length is invalid")
];

export const validateLogin = [
  check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Email is not valid"),
  check("password").notEmpty().withMessage("Password is required")
];
