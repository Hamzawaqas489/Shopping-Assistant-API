import express from "express";
import { SharedListController } from "../controllers/sharedListController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  validateCreateSharedList,
  validateUpdateSharedListStatus
} from "../validator/sharedListValidator.js";

const router = express.Router();

router.post(
  "/createShareList",
  //authenticate,
  validateCreateSharedList,
  validateRequest,
  SharedListController.create
);

router.get(
  "/myLists/:userId",
  // authenticate,  // Enable this if your routes are protected
  SharedListController.getUserLists
);

router.put(
  "/shareListToFriend/:listId/:friendId",
  //authenticate,
  SharedListController.shareToFriend
);


router.get(
  "/received",
  //authenticate,
  SharedListController.received
);

router.get(
  "list/:listId",
  //authenticate,
  SharedListController.details
);

router.put(
  "list/:listId/status",
  //authenticate,
  //validateUpdateSharedListStatus,
  //validateRequest,
  SharedListController.updateStatus
);

router.post(
  "/copy/:listId",
  //authenticate,
  SharedListController.copy
);

router.put(
  "/:listId/items",
  //authenticate,
  SharedListController.updateItems
);

router.delete(
  "/:listId/:userId",
  SharedListController.delete
);

router.put(
  "/getIsRestricted/:listId",
  SharedListController.getIsRestricted
);

router.get(
  "/IsRestricted",
  SharedListController.getIsRestrictedOrNot
);

export default router;
