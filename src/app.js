// src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import AuthRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sharedListRoutes from "./routes/sharedListRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import userRoutes from "./routes/userRoutes.js"

const app = express();
app.use(cors());
app.use(express.json());



app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "src", "uploads"))
);
app.use("/api/auth", AuthRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shared-lists", sharedListRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/user", userRoutes);

export default app;
