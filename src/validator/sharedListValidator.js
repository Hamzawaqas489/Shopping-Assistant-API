import { check } from "express-validator";

export const validateCreateSharedList = [
  check("receiverCustomerId")
    .isInt().withMessage("receiverCustomerId must be a valid user id"),

  check("items")
    .isArray({ min: 1 }).withMessage("items array is required"),

  check("items.*.productId")
    .isInt().withMessage("productId must be an integer"),

  check("items.*.quantity")
    .isInt({ min: 1 }).withMessage("quantity must be greater than 0")
];

export const validateUpdateSharedListStatus = [
  check("status")
    .isIn(["Accepted", "Declined"])
    .withMessage("Status must be Accepted or Declined")
];
