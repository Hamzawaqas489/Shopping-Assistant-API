import jwt from "jsonwebtoken";
import { AuthService } from "../services/authService.js";

export const AuthController = {

  signup: async (req, res) => {
    try {
      await AuthService.signup(req.body);

      return res.status(201).json({
        status: true,
        message: "User registered successfully"
      });

    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await AuthService.login(email, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      const token = jwt.sign(
        {
          userId: user.UserID,
          role: user.Role,
          storeId: user.StoreID
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(200).json({
        status: true,
        token:token,
        data:user
      });

    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Login failed"
      });
    }
  }
};
