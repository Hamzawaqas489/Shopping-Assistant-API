// src/app.js
import express from "express";
import cors from "cors";

import AuthRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import sharedListRoutes from "./routes/sharedListRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Public
app.use("/api/auth", AuthRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/shared-lists", sharedListRoutes);
app.use("/api/friends", friendRoutes);

export default app;
