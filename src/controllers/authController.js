// src/controllers/authController.js
import { AuthService } from "../services/authService.js";

export const AuthController = {
  create: async (req, res) => {
    try {
      const result = await AuthService.SignUpUser(req.body);
      if (result.rowsAffected > 0) {
        return res.status(201).json({
          status: true,
          message: "User Created Successfully.",
          data: { id: result.customerId, name: req.body.name, email: req.body.email, phone: req.body.phone }
        });
      } else {
        return res.status(400).json({ status: false, message: "Customer was not created. Please check your input." });
      }
    } catch (err) {
      console.error("Create customer error:", err);
      return res.status(500).json({ status: false, message: "Error Creating Customer.", error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const user = await AuthService.LoginUser(req.body);
      if (!user) {
        return res.status(401).json({ status: false, message: "Invalid email or password" });
      }
      return res.status(200).json({ status: true, message: "Login successful", data: user });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ status: false, message: "Error during login", error: err.message });
    }
  }
};
