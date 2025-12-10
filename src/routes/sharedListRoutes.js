// src/routes/sharedListRoutes.js
import express from "express";
import { SharedListController } from "../controllers/sharedListController.js";
import { validateSharedList } from "../validator/sharedListValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, validateSharedList, validateRequest, SharedListController.create);
router.get("/received", authenticate, SharedListController.received);
router.get("/:listId", authenticate, SharedListController.details);
router.put("/:listId/status", authenticate, SharedListController.updateStatus);

export default router;
