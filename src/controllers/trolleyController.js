// src/controllers/trolleyController.js
import { TrolleyService } from "../services/trolleyService.js";

export const TrolleyController = {

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
  }
};
