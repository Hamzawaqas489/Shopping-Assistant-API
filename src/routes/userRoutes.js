// src/routes/userRoutes.js
import express from "express";
import { UserController } from "../controllers/userController.js";
import { validateUser } from "../validator/userValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js"; // Assuming you have a generic upload middleware

const router = express.Router();

router.post(
  "/addEmployee/:id",
  (req, res, next) => {
    req.uploadType = "profile";
    next();
  },
  upload.single("profilePic"), // Optional: if you want to allow profile picture upload during user creation
  //authenticate, // uncomment if authentication is needed
  validateUser,
  validateRequest,
  UserController.addEmployee
);

router.get(
  "/getOwner/:id",
  //authenticate,
  UserController.getOwner
);

// Get all employees of a specific store
router.get(
  "/storeEmployees/:storeId",
  //authenticate,
  UserController.getStoreEmployees
);

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

// Update only user role
router.patch(
  "/updateRole/:id",
  //authenticate,
  UserController.updateRole
);

// Update only user status
router.patch(
  "/updateStatus/:id",
  //authenticate,
  UserController.updateStatus
);

router.get(
  "/getCashiers",
  //authenticate,
  UserController.getCashiers
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

// Check contacts
router.post(
  "/checkContacts",
  //authenticate,
  UserController.checkContacts
);

export default router;
