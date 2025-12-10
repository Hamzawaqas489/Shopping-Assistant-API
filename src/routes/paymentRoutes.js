// src/routes/paymentRoutes.js
import express from "express";
import { PaymentController } from "../controllers/paymentController.js";
import { validatePaymentRequest } from "../validator/paymentValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, validatePaymentRequest, validateRequest, PaymentController.create);
router.get("/pending", authenticate, PaymentController.listPending);
router.put("/:paymentId/status", authenticate, PaymentController.updateStatus);

export default router;
