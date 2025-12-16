// src/controllers/trolleyController.js
import { TrolleyService } from "../services/trolleyService.js";

export const TrolleyController = {

  
  list: async (req, res) => {
    try {
      const { storeId } = req.query;

      const trolleys = await TrolleyService.getAll(
        storeId ? parseInt(storeId) : null
      );

      return res.status(200).json({
        status: true,
        message: "Trolleys fetched successfully",
        data: trolleys
      });

    } catch (err) {
      console.error("List trolleys error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch trolleys",
        error: err.message
      });
    }
  },

  
  details: async (req, res) => {
    try {
      const trolley = await TrolleyService.getById(parseInt(req.params.id));

      if (!trolley) {
        return res.status(404).json({
          status: false,
          message: "Trolley not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Trolley details fetched successfully",
        data: trolley
      });

    } catch (err) {
      console.error("Trolley details error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch trolley",
        error: err.message
      });
    }
  },

  
  create: async (req, res) => {
    try {
      const created = await TrolleyService.create(req.body);

      return res.status(201).json({
        status: true,
        message: "Trolley created successfully",
        data: created
      });

    } catch (err) {
      console.error("Create trolley error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to create trolley",
        error: err.message
      });
    }
  },

  
  update: async (req, res) => {
    try {
      const updated = await TrolleyService.update(
        parseInt(req.params.id),
        req.body
      );

      if (!updated) {
        return res.status(404).json({
          status: false,
          message: "Trolley not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Trolley updated successfully"
      });

    } catch (err) {
      console.error("Update trolley error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to update trolley",
        error: err.message
      });
    }
  },

  
  remove: async (req, res) => {
    try {
      const removed = await TrolleyService.remove(parseInt(req.params.id));

      if (!removed) {
        return res.status(404).json({
          status: false,
          message: "Trolley not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Trolley deleted successfully"
      });

    } catch (err) {
      console.error("Delete trolley error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to delete trolley",
        error: err.message
      });
    }
  },

  
  assign: async (req, res) => {
    try {
      const trolley = await TrolleyService.assignByQRCode(req.body);

      return res.status(200).json({
        status: true,
        message: "Trolley assigned successfully",
        data: trolley
      });

    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message
      });
    }
  },

  
  release: async (req, res) => {
    try {
      const released = await TrolleyService.release(
        parseInt(req.params.id)
      );

      if (!released) {
        return res.status(404).json({
          status: false,
          message: "Trolley not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Trolley released successfully"
      });

    } catch (err) {
      console.error("Release trolley error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to release trolley",
        error: err.message
      });
    }
  }
};
