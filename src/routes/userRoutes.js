// src/routes/userRoutes.js
import express from "express";
import { UserController } from "../controllers/userController.js";
import { validateUser } from "../validator/uservalidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js"; // Assuming you have a generic upload middleware

const router = express.Router();

// Get user details by ID
router.get(
  "/userDetail/:id",
  //authenticate,
  UserController.details
);

// Update whole user
router.put(
  "/updateUser/:id",
  //authenticate,
  //validateUser,
  //validateRequest,
  UserController.update
);

// Update only profile picture
router.patch(
  "/updateProfilePic/:id",
  //authenticate,
  (req, res, next) => {
    req.uploadType = "profile"; // optional, if your upload middleware uses it
    next();
  },
  upload.single("profilePic"), // form-data field name: "profilePic"
  UserController.updateProfilePic
);

// Delete user
router.delete(
  "/deleteUser/:id",
  //authenticate,
  UserController.remove
);

export default router;
