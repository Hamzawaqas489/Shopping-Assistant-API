// src/controllers/ratingController.js
import { RatingService } from "../services/ratingService.js";

export const RatingController = {
  add: async (req, res) => {
    try {
      const data = { ...req.body, customerId: req.user.id }; // from auth
      const affected = await RatingService.add(data);
      return res.status(201).json({ status: true, affected });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  },

  listByProduct: async (req, res) => {
    try {
      const list = await RatingService.getByProduct(parseInt(req.params.productId));
      return res.status(200).json({ status: true, data: list });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "Error", error: err.message });
    }
  }
};
