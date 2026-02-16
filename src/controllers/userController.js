// src/controllers/userController.js
import { UserService } from "../services/userService.js";

export const UserController = {

   // Create a new user (Name, Phone, Email, Role)
  createUser: async (req, res) => {
    try {
      const StoreID = parseInt(req.params.id); // Assuming store ID is passed as a URL parameter
      const { Name, Phone, Email, Role , } = req.body;


      const created = await UserService.createUser({ Name, Phone, Email, Role, StoreID });

      if (!created) {
        return res.status(500).json({
          status: false,
          message: "Failed to create user"
        });
      }

      return res.status(201).json({
        status: true,
        message: "User created successfully"
      });

    } catch (err) {
      console.error("Create user error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to create user",
        error: err.message
      });
    }
  },

  // Get user by ID
  details: async (req, res) => {
    try {
      const user = await UserService.getById(parseInt(req.params.id));

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "User details fetched successfully.",
        data: user
      });

    } catch (err) {
      console.error("User details error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch user",
        error: err.message
      });
    }
  },

  getCashiers: async (req, res) => {
    try {
      const cashiers = await UserService.getCashiers();

      if (!cashiers) {
        return res.status(404).json({
          status: false,
          message: "Cashiers not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Cashiers fetched successfully.",
        data: cashiers
      });

    } catch (err) {
      console.error("Get Cashiers error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch cashiers",
        error: err.message
      });
    }
  },

  // Update only profile picture
  updateProfilePic: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "Profile picture file is required"
        });
      }

      const profilePicName = req.file.filename;

      const updated = await UserService.updateProfilePic(
        parseInt(req.params.id),
        profilePicName
      );

      if (!updated) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Profile picture updated successfully",
        data: profilePicName
      });

    } catch (err) {
      console.error("Update profile picture error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to update profile picture",
        error: err.message
      });
    }
  },

  // Update whole user
  update: async (req, res) => {
    try {
      if (req.file) {
        req.body.ProfilePicName = req.file.filename;
      }

      const updated = await UserService.update(
        parseInt(req.params.id),
        req.body
      );

      if (!updated) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "User updated successfully"
      });

    } catch (err) {
      console.error("Update user error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to update user",
        error: err.message
      });
    }
  },

  // Delete user
  remove: async (req, res) => {
    try {
      const removed = await UserService.remove(parseInt(req.params.id));

      if (!removed) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "User deleted successfully"
      });

    } catch (err) {
      console.error("Delete user error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to delete user",
        error: err.message
      });
    }
  },

  updateRole: async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { Role } = req.body;

    if (!Role) {
      return res.status(400).json({
        status: false,
        message: "Role is required"
      });
    }

    const updated = await UserService.updateRole(userId, Role);

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "User role updated successfully"
    });

  } catch (err) {
    console.error("Update role error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update user role",
      error: err.message
    });
  }
}

};
