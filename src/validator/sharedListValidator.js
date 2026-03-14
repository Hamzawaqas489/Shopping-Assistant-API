import { check } from "express-validator";

export const validateCreateSharedList = [
  check("listName")
    .notEmpty().withMessage("List name is required")
    .isLength({ min: 1, max: 100 }).withMessage("List name must be 1 to 100 characters long"),

  check("receiverCustomerId")
    .optional({ nullable: true })
    .isInt().withMessage("receiverCustomerId must be a valid user id"),

  check("items")
    .isArray({ min: 1 }).withMessage("items array is required"),

  check("items.*.productId")
    .isInt().withMessage("productId must be an integer"),

  check("items.*.quantity")
    .isFloat({ min: 0.1 }).withMessage("quantity must be greater than 0")
];

export const validateUpdateSharedListStatus = [
  check("status")
    .isIn(["Accepted", "Declined"])
    .withMessage("Status must be Accepted or Declined")
];
