import { SharedListService } from "../services/sharedListService.js";

export const SharedListController = {

  create: async (req, res) => {
  try {
    const listId = await SharedListService.create({
      listName: req.body.listName,
      senderCustomerId: req.user?.id || req.body.senderCustomerId,
      receiverCustomerId: req.body.receiverCustomerId ?? null,
      storeId: req.body.storeId, // Pass the storeId
      items: req.body.items
    });

    return res.status(201).json({
      status: true,
      message: "List created successfully",
      listId
    });

  } catch (err) {
    return res.status(400).json({
      status: false,
      message: err.message
    });
  }
},

  getUserLists: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          status: false,
          message: "User ID is required",
        });
      }

      const lists = await SharedListService.getUserLists(userId);

      return res.status(200).json({
        status: true,
        message: "Shopping lists retrieved successfully",
        data: lists,
      });

    } catch (err) {
      console.error("Error fetching user lists:", err);
      return res.status(500).json({
        status: false,
        message: err.message || "Failed to retrieve shopping lists",
      });
    }
  },

  shareToFriend: async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const friendId = parseInt(req.params.friendId);

      await SharedListService.shareToFriend(listId, friendId);

      return res.status(200).json({
        status: true,
        message: "List shared with friend successfully"
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  received: async (req, res) => {
    try {
      const lists = await SharedListService.getReceived(req.user.id);

      return res.status(200).json({
        status: true,
        data: lists
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch shared lists",
        error: err.message
      });
    }
  },

  details: async (req, res) => {
    try {
      const data = await SharedListService.getDetails(
        parseInt(req.params.listId),
        req.user.id
      );

      if (!data)
        return res.status(404).json({
          status: false,
          message: "Shared list not found"
        });

      return res.status(200).json({
        status: true,
        data
      });

    } catch (err) {
      return res.status(403).json({
        status: false,
        message: err.message
      });
    }
  },

  updateStatus: async (req, res) => {
    try {
      await SharedListService.updateStatus(
        parseInt(req.params.listId),
        req.user.id,
        req.body.status
      );

      return res.status(200).json({
        status: true,
        message: "Shared list updated"
      });

    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  copy: async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const newStoreId = parseInt(req.body.storeId);

      if (!listId || !newStoreId) {
        return res.status(400).json({ status: false, message: "listId and storeId are required" });
      }

      const newListId = await SharedListService.copyList(listId, newStoreId);

      return res.status(201).json({
        status: true,
        message: "List copied successfully",
        newListId
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message || "Failed to copy list"
      });
    }
  },

  delete: async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const userId = parseInt(req.params.userId);

      if (!listId || !userId) {
        return res.status(400).json({ status: false, message: "listId and userId are required" });
      }

      await SharedListService.deleteList(listId, userId);

      return res.status(200).json({
        status: true,
        message: "List deleted successfully"
      });
    } catch (err) {
       return res.status(500).json({
         status: false,
         message: err.message || "Failed to delete list"
       });
    }
  }
};
