// src/routes/productRoutes.js
import express from "express";
import { ProductController } from "../controllers/productController.js";
import { validateProduct } from "../validator/productValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/allProducts",
    authenticate,
    ProductController.listByCategory
);

router.get("/productDetail/:id",
    authenticate,
    ProductController.details
);

router.post(
  "/createProduct",
  authenticate,
  (req, res, next) => {
    req.uploadType = "product";
    next();
  },
   upload.single("image"),
  validateProduct,
  validateRequest,
  ProductController.create
);

router.put(
  "/updateProduct/:id",
  authenticate,
  validateProduct,
  validateRequest,
  ProductController.update
);

router.delete(
  "/deleteProduct/:id",
  authenticate,
  ProductController.remove
);

export default router;
