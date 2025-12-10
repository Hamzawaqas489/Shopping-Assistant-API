// src/routes/ratingRoutes.js
import express from "express";
import { RatingController } from "../controllers/ratingController.js";
import { validateRating } from "../validator/ratingValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, validateRating, validateRequest, RatingController.add);
router.get("/product/:productId", RatingController.listByProduct);

export default router;
