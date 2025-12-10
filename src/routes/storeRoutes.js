// src/routes/storeRoutes.js
import express from "express";
import { StoreController } from "../controllers/storeController.js";
import { validateStore } from "../validator/storeValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", StoreController.list);
router.post("/", authenticate, validateStore, validateRequest, StoreController.create); // admin only - protect further
router.put("/:id", authenticate, validateStore, validateRequest, StoreController.update);
router.delete("/:id", authenticate, StoreController.remove);

export default router;
