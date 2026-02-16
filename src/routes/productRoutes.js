// src/routes/productRoutes.js
import express from "express";
import { ProductController } from "../controllers/productController.js";
import { validateProduct } from "../validator/productValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/allProducts/:CategoryId",
  //authenticate,
  ProductController.listByCategory
);

router.get("/productDetail/:id",
  //authenticate,
  ProductController.details
);

router.post(
  "/createProduct",
  //authenticate,
  //validateProduct,
  //validateRequest,
  (req, res, next) => {
    req.uploadType = "product";
    next();
  },
   upload.single("Image"),
  ProductController.create
);

router.put(
  "/updateProduct/:id",
  //authenticate,
  ProductController.update
);

router.delete(
  "/deleteProduct/:id",
  //authenticate,
  ProductController.remove
);

export default router;
