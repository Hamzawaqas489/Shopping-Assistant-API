// src/routes/orderRoutes.js
import express from "express";
import { OrderController } from "../controllers/orderController.js";
import { validateOrder } from "../validator/orderValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, validateOrder, validateRequest, OrderController.create);
router.get("/customer/:customerId", authenticate, OrderController.listByCustomer);
router.get("/:orderId", authenticate, OrderController.details);
router.put("/:orderId/status", authenticate, OrderController.updateStatus);

export default router;
