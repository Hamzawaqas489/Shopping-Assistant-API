import express from "express";
import { OrderController } from "../controllers/orderController.js";
import {
  validateOrderCreate,
  validateOrderUpdateStatus,
  validateRating
} from "../validator/orderValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Get all orders
router.get(
  "/allOrders",
  //authenticate,
  OrderController.list
);

// Get order details by ID
router.get(
  "/orderDetail/:id",
  //authenticate,
  OrderController.details
);

// Update order status
router.patch(
  "/updateStatus/:id",
  //authenticate,
  //validateOrderUpdateStatus,
  //validateRequest,
  OrderController.updateStatus
);

// Delete order by ID
router.delete(
  "/deleteOrder/:id",
  //authenticate,
  OrderController.remove
);

// Rate a product in an order
router.post(
  "/rate/:orderId/:productId",
  //authenticate,
  //validateRating,
  //validateRequest,
  OrderController.rateProduct
);

/*
  Create order with details (multipart/form-data):
  Fields:
    - orderDate
    - paymentStatus
    - trolleyId
    - customerId
    - cashierId
    - totalAmount
    - items (JSON string)
*/
router.post(
  "/create",
  //authenticate,
  upload.none(),              // enables multipart/form-data without files
  //validateOrderCreate,        // correct validator
  //validateRequest,
  OrderController.createWithDetails
);

export default router;
