// src/controllers/storeController.js
import { get } from "http";
import { StoreService } from "../services/storeService.js";

export const StoreController = {
  allStores: async (req, res) => {
    try {
      const stores = await StoreService.getAll();
      return res.status(200).json({
         status: true,
         message:"All stores fetched successfully.",
         data: stores
         });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Error fetching stores",
        error: err.message });
    }
  },

  getStoreById: async (req, res) => {
    try {
      const store = await StoreService.getById(req.params.id);

      if (!store) {
        return res.status(404).json({
          status: false,
          message: "Store not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Store fetched successfully",
        data: store
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Error fetching store",
        error: err.message
      });
    }
  },

  create: async (req, res) => {
    try {
      const storeLogo = req.file ? req.file.filename : null;

      const result = await StoreService.create({
        StoreName: req.body.StoreName,
        StoreAddress: req.body.StoreAddress,
        UserID: req.body.UserID,
        StoreLogo: storeLogo,
      });

      return res.status(201).json({
        status: true,
        message: "Store created successfully",
        data: result,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Error creating store",
        error: err.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await StoreService.update(req.params.id, req.body);
      if (updated > 0)
      {
        return res.status(200).json({
          status: true,
          message: "Store updated"
        });
      }
      else
      {
        return res.status(404).json({
          status: false,
          message: "Store not found"
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Error updating store",
        error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await StoreService.remove(req.params.id);
      if (removed > 0)
      {
        return res.status(200).json({
          status: true,
          message: "Store removed"
        });
      }
      else
      {
        return res.status(404).json({
          status: false,
          message: "Store not found"
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Error removing store",
        error: err.message
      });
    }
  }
};
