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

// --- NEW Shopping / Cashier Routes ---

router.post("/session/start", OrderController.startShoppingSession);
router.post("/session/add-item", OrderController.addItemToOrder);
router.post("/session/scan-item", OrderController.scanItemToOrder);
router.get("/session/:id/items", OrderController.getOrderSessionItems);
router.post("/session/:id/checkout", OrderController.requestCheckout);
router.post("/session/:id/confirm", OrderController.confirmOrder);

router.get("/store/:storeId/active-trolleys", OrderController.getActiveTrolleys);
router.get("/store/:storeId/checkout-requests", OrderController.getCheckoutRequests);
router.get("/session/:orderId/list", OrderController.getSessionList);

// --- Past Orders & Re-order Routes ---
router.get("/customer/:customerId/pastOrders", OrderController.getCustomerPastOrders);
router.get("/:id/reorderDetails", OrderController.getReorderDetails);
router.post("/reorder", OrderController.submitReorder);

// --- AI Vision Sync Route ---
router.post("/session/:id/sync-detections", OrderController.syncDetections);

export default router;
