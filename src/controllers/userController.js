// src/controllers/userController.js
import { UserService } from "../services/userService.js";

export const UserController = {

  getOwner: async (req, res) => {
    try {
      const owner = await UserService.getOwner(parseInt(req.params.id));

      if (!owner) {
        return res.status(404).json({
          status: false,
          message: "Owner not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Owner fetched successfully.",
        data: owner
      });

    } catch (err) {
      console.error("Get owner error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch owner",
        error: err.message
      });
    }
  },

  // Get all employees for a specific store
  getStoreEmployees: async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (!storeId) {
        return res.status(400).json({ status: false, message: "Store ID is required" });
      }

      const employees = await UserService.getStoreEmployees(storeId);

      return res.status(200).json({
        status: true,
        message: "Employees fetched successfully.",
        data: employees
      });

    } catch (err) {
      console.error("Get store employees error:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch employees",
        error: err.message
      });
    }
  },

   // Create a new user (Name, Phone, Email, Role)
  addEmployee: async (req, res) => {
    try {
      const StoreID = parseInt(req.params.id); // Assuming store ID is passed as a URL parameter
      const ProfilePicName = req.file ? req.file.filename : null; // Handle optional profile picture upload
      const { Name, Phone, Email, Role, Password } = req.body;

      const created = await UserService.addEmployee({ Name, Phone, Email, Password, Role, StoreID, ProfilePicName });

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
},

updateStatus: async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { Status } = req.body;

    if (!Status) {
      return res.status(400).json({
        status: false,
        message: "Status is required"
      });
    }

    const updated = await UserService.updateStatus(userId, Status);

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "User status updated successfully"
    });

  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update user status",
      error: err.message
    });
  }
},

checkContacts: async (req, res) => {
  try {
    const { contacts, userId } = req.body;

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        status: false,
        message: "Contacts array is required"
      });
    }

    const registeredUsers = await UserService.checkContacts(contacts, userId);

    return res.status(200).json({
      status: true,
      message: "Contacts checked successfully",
      data: registeredUsers
    });

  } catch (err) {
    console.error("Check contacts error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to check contacts",
      error: err.message
    });
  }
}

};
