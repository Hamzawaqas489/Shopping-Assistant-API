// src/routes/productRoutes.js
import express from "express";
import { ProductController } from "../controllers/productController.js";
import { validateProduct, validateBulkProduct } from "../validator/productValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// POST → add multiple products to store inventory
router.post(
  "/addBulkProducts",
  validateBulkProduct,
  validateRequest,
  ProductController.addBulkProducts
);

// Get all products of a store
router.get("/storeProducts/:storeId", ProductController.getStoreProducts);


router.put("/updateStoreProduct", ProductController.updateStoreProduct);

router.get("/allProducts/:CategoryId",
  //authenticate,
  ProductController.listByCategory
);

router.get("/getAllProducts", ProductController.getAllProducts);

router.get("/productPrices/:productId", ProductController.getProductPrices);

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

router.get("/getProductByQr/:qrCode",
   ProductController.getProductByQrCode
  );

router.post(
  "/addProductByQr/:productId",
  //authenticate,
  ProductController.addProductByQr
);

export default router;
