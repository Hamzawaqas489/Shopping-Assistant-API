import { check } from "express-validator";

export const validateSendRequest = [
  check("receiverId")
    .isInt().withMessage("receiverId must be a valid user id")
];

export const validateRespondRequest = [
  check("senderId")
    .isInt().withMessage("senderId must be a valid user id"),

  check("status")
    .isIn(["Accepted", "Blocked"])
    .withMessage("Status must be Accepted or Blocked")
];
