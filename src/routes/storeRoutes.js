// src/routes/storeRoutes.js
import express from "express";
import { StoreController } from "../controllers/storeController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { validateStore } from "../validator/storeValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/allstores",
    StoreController.allStores
);

router.post(
  "/createstore",
  (req, res, next) => {
    req.uploadType = "storelogo"; // 🔥 IMPORTANT
    next();
  },
  upload.single("storeLogo"), // field name from frontend
  StoreController.create
);

router.put("/updatestore/:id",
    //authenticate,
    //validateStore,
    //validateRequest,
    StoreController.update);

router.delete("/deletestore/:id",
    //authenticate,
    StoreController.remove
);

export default router;
