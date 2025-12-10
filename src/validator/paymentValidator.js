// src/validator/paymentValidator.js
import { check } from "express-validator";

export const validatePaymentRequest = [
  check("customerId").isInt(),
  check("orderId").isInt(),
  check("amount").isFloat()
];
