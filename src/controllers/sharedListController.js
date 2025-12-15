import { SharedListService } from "../services/sharedListService.js";

export const SharedListController = {

  create: async (req, res) => {
    try {
      const listId = await SharedListService.create({
        senderCustomerId: req.user.id,
        receiverCustomerId: req.body.receiverCustomerId,
        items: req.body.items
      });

      return res.status(201).json({
        status: true,
        message: "Shared list created successfully",
        listId
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
  }
};
