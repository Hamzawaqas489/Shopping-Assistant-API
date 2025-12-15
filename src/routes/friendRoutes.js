import express from "express";
import { FriendController } from "../controllers/friendController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  validateSendRequest,
  validateRespondRequest
} from "../validator/friendValidator.js";

const router = express.Router();

router.post(
  "/send",
  authenticate,
  validateSendRequest,
  validateRequest,
  FriendController.send
);

router.post(
  "/respond",
  authenticate,
  validateRespondRequest,
  validateRequest,
  FriendController.respond
);

router.get(
  "/friends",
  authenticate,
  FriendController.listFriends
);

router.get(
  "/requests",
  authenticate,
  FriendController.listRequests
);

export default router;
