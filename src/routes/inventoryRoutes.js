// src/routes/inventoryRoutes.js
import express from "express";
import { InventoryController } from "../controllers/inventoryController.js";
import { validateInventory } from "../validator/inventoryValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/store/:storeId", InventoryController.listByStore);
router.post("/", authenticate, validateInventory, validateRequest, InventoryController.assign);
router.delete("/:storeId/:productId", authenticate, InventoryController.remove);

export default router;
