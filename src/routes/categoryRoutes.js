import express from "express";
import { CategoryController } from "../controllers/categoryController.js";
import {validateCategory} from "../validator/categoryValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/getAllCategories",
  //authenticate,
  CategoryController.allCategories
);

router.post(
  "/createCategory",
  //authenticate,
  //validateCategory,
  //validateRequest,
  CategoryController.create
);

router.put(
  "/updateCategory/:id",
  //authenticate,
  //validateCategory,
  //validateRequest,
  CategoryController.update
);

router.delete(
  "/deleteCategory/:id",
  //authenticate,
  //validateRequest,
  CategoryController.remove
);

export default router;
