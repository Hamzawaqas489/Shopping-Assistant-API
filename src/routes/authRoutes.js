// src/routes/authRoutes.js
import express from "express";
import { AuthController } from "../controllers/authController.js";
import { validateLogin, validateSignUp } from "../validator/authValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup",
    validateSignUp,
    validateRequest,
    AuthController.signup);

router.post("/login",
    validateLogin,
    validateRequest,
    AuthController.login);

export default router;
