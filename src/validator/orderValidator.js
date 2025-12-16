import { check } from "express-validator";

export const validateOrderCreate = [
  check("customerId").isInt({ gt: 0 }).withMessage("Valid customerId required"),
  check("cashierId").isInt({ gt: 0 }).withMessage("Valid cashierId required"),
  check("trolleyId").isInt({ gt: 0 }).withMessage("Valid trolleyId required"),
  

  //check("items").isArray({ min: 1 }).withMessage("Items array required"),
  check("items.*.productId").isInt({ gt: 0 }),
  check("items.*.quantity").isInt({ min: 1 })
];

export const validateOrderUpdateStatus = [
  check("paymentStatus")
    .isIn(["Pending", "Paid", "Cancelled"])
    .withMessage("Invalid payment status")
];

export const validateRating = [
  check("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5")
];
