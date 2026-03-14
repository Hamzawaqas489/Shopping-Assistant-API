import { AuthService } from "../services/authService.js";

export const AuthController = {
  signup: async (req, res) => {
    try {
      const user = await AuthService.signup(req.body);

      return res.status(201).json({
        status: true,
        message: "User registered successfully",
        data: user
      });

    } catch (error) {
      console.error("Signup error:", error); 
      return res.status(400).json({
        status: false,
        message: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { Email, Password } = req.body;

      const user = await AuthService.login(Email, Password);

      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password"
        });
      }

      // JWT REMOVED
      
      return res.status(200).json({
        status: true,
        message: "Login successful",
        data: user
      });

    } catch (error) {
      console.error("Login Error:", error);

      return res.status(500).json({
        status: false,
        message: "Login failed"
      });
    }
  }
};
