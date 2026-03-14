import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors as an object key-value pair: { "Email": "Invalid email", ... }
    const formattedErrors = {};
    errors.array().forEach(err => {
      // Use the field name as the key
      if (!formattedErrors[err.path]) {
        formattedErrors[err.path] = err.msg;
      }
    });

    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: formattedErrors
    });
  }
  next();
};
