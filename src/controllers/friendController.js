// src/controllers/friendController.js
import { FriendService } from "../services/friendService.js";

export const FriendController = {
  send: async (req, res) => {
    try {
      const senderId = req.user.id;
      const receiverId = parseInt(req.body.receiverId);
      await FriendService.sendRequest(senderId, receiverId);
      return res.status(200).json({ status: true, message: "Request sent" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  respond: async (req, res) => {
    try {
      const receiverId = req.user.id;
      const senderId = parseInt(req.body.senderId);
      const status = req.body.status; // 'Accepted' or 'Rejected'
      await FriendService.respondRequest(senderId, receiverId, status);
      return res.status(200).json({ status: true, message: "Updated" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  listFriends: async (req, res) => {
    try {
      const list = await FriendService.getFriends(req.user.id);
      return res.status(200).json({ status: true, data: list });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  listRequests: async (req, res) => {
    try {
      const list = await FriendService.getRequests(req.user.id);
      return res.status(200).json({ status: true, data: list });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
