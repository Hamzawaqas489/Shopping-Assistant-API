// src/routes/categoryRoutes.js
import express from "express";
import { CategoryController } from "../controllers/categoryController.js";
import { validateCategory } from "../validator/categoryValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/store/:storeId", CategoryController.listByStore);
router.post("/", authenticate, validateCategory, validateRequest, CategoryController.create);
router.delete("/:id", authenticate, CategoryController.remove);

export default router;
