// src/routes/friendRoutes.js
import express from "express";
import { FriendController } from "../controllers/friendController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", authenticate, FriendController.send);
router.post("/respond", authenticate, FriendController.respond);
router.get("/friends", authenticate, FriendController.listFriends);
router.get("/requests", authenticate, FriendController.listRequests);

export default router;
