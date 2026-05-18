import express from "express";
import { SaleController } from "../controllers/saleController.js";

const router = express.Router();

// Get all active sales globally (for customer login alert)
router.get("/active", SaleController.getAllActiveSales);

// Get active sales for a specific store
router.get("/store/:storeId", SaleController.getActiveSalesForStore);

// Create a new sale for a store (Store Owner)
router.post("/:storeId", SaleController.createSale);

// End a specific sale
router.put("/:storeId/:saleId/end", SaleController.endSale);

export default router;
