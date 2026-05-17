import { FriendService } from "../services/friendService.js";

export const FriendController = {

  send: async (req, res) => {
    try {
      await FriendService.sendRequest(req.body.senderId, req.body.receiverId);

      return res.status(200).json({
        status: true,
        message: "Friend request sent successfully"
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  respond: async (req, res) => {
    try {
      await FriendService.respondRequest(
        req.body.senderId,
        req.body.receiverId,
        req.body.status
      );

      return res.status(200).json({
        status: true,
        message: "Friend request updated"
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  listFriends: async (req, res) => {
    try {
      const friends = await FriendService.getFriends(req.query.userId);

      return res.status(200).json({
        status: true,
        data: friends
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch friends",
        error: err.message
      });
    }
  },

  listRequests: async (req, res) => {
    try {
      const requests = await FriendService.getRequests(req.query.userId);

      return res.status(200).json({
        status: true,
        data: requests
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch friend requests",
        error: err.message
      });
    }
  }
};
