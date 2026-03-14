import { check } from "express-validator";

export const validateSignUp = [
  check("Name").trim().notEmpty().withMessage("Name is required").isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
  check("Email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email address"),
  check("Password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  check("Phone").trim().notEmpty().withMessage("Phone is required").isLength({ min: 7, max: 20 }).withMessage("Please provide a valid phone number")
];

export const validateLogin = [
  check("Email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email address"),
  check("Password").notEmpty().withMessage("Password is required")
];
