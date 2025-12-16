// src/routes/trolleyRoutes.js
import express from "express";
import { TrolleyController } from "../controllers/trolleyController.js";
import { validateAssignTrolley } from "../validator/trolleyValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get(
  "/allTrolleys",
  //authenticate,
  TrolleyController.list
);


router.get(
  "/trolleyDetail/:id",
  //authenticate,
  TrolleyController.details
);


router.post(
  "/createTrolley",
  //authenticate,
  TrolleyController.create
);


router.put(
  "/updateTrolley/:id",
  //authenticate,
  TrolleyController.update
);


router.delete(
  "/deleteTrolley/:id",
  //authenticate,
  TrolleyController.remove
);


router.post(
  "/assign",
  //authenticate,
  //validateAssignTrolley,
  //validateRequest,
  TrolleyController.assign
);


router.patch(
  "/release/:id",
  //authenticate,
  TrolleyController.release
);

export default router;
