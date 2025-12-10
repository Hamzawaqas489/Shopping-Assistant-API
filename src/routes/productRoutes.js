// src/routes/productRoutes.js
import express from "express";
import { ProductController } from "../controllers/productController.js";
import { validateProduct } from "../validator/productValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/category/:categoryId", ProductController.listByCategory);
router.get("/:id", ProductController.details);
router.post("/", authenticate, validateProduct, validateRequest, ProductController.create);
router.put("/:id", authenticate, validateProduct, validateRequest, ProductController.update);
router.delete("/:id", authenticate, ProductController.remove);

export default router;
