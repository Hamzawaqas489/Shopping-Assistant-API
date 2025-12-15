// src/routes/trolleyRoutes.js
import express from "express";
import { TrolleyController } from "../controllers/trolleyController.js";
import { validateAssignTrolley } from "../validator/trolleyValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/assign",
  authenticate,
  validateAssignTrolley,
  validateRequest,
  TrolleyController.assign
);

export default router;
