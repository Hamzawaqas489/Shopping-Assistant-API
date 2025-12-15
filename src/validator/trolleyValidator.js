// src/validator/trolleyValidator.js
import { check } from "express-validator";

export const validateAssignTrolley = [
  check("qrCode").notEmpty().withMessage("QR code is required"),
  check("customerId").isInt().withMessage("Valid customerId required")
];
