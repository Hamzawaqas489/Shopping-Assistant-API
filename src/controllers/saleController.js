import { SaleService } from "../services/saleService.js";

export const SaleController = {
  createSale: async (req, res) => {
    try {
      const { storeId } = req.params;
      const { saleName, discountPercentage, applyToAll, categoryIds } = req.body;
      
      if (!saleName || discountPercentage == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await SaleService.createSale(
        parseInt(storeId), 
        saleName, 
        parseFloat(discountPercentage), 
        applyToAll, 
        categoryIds
      );

      res.status(201).json({ message: "Sale created successfully", saleId: result.saleId });
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ error: "Failed to create sale" });
    }
  },

  endSale: async (req, res) => {
    try {
      const { storeId, saleId } = req.params;
      
      const success = await SaleService.endSale(parseInt(saleId), parseInt(storeId));
      if (success) {
        res.status(200).json({ message: "Sale ended successfully" });
      } else {
        res.status(404).json({ error: "Sale not found or already ended" });
      }
    } catch (error) {
      console.error("Error ending sale:", error);
      res.status(500).json({ error: "Failed to end sale" });
    }
  },

  getActiveSalesForStore: async (req, res) => {
    try {
      const { storeId } = req.params;
      const sales = await SaleService.getActiveSalesForStore(parseInt(storeId));
      res.status(200).json({ data: sales });
    } catch (error) {
      console.error("Error fetching active sales for store:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  },

  getAllActiveSales: async (req, res) => {
    try {
      const sales = await SaleService.getAllActiveSales();
      res.status(200).json({ data: sales });
    } catch (error) {
      console.error("Error fetching all active sales:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  }
};
