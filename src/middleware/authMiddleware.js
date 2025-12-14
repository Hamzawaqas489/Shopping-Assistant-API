import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: false,
        message: "Authorization token missing"
      });
    }

    // Expected format: Bearer <token>
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        status: false,
        message: "Invalid authorization format"
      });
    }

    const token = parts[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      decoded contains:
      {
        userId,
        role,
        storeId,
        iat,
        exp
      }
    */

    req.user = decoded;
    next();

  } catch (error) {

    const message =
      error.name === "TokenExpiredError"
        ? "Token expired"
        : "Invalid token";

    return res.status(401).json({
      status: false,
      message
    });
  }
};
