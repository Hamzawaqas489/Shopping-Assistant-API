import { CategoryService } from "../services/categoryService.js";

export const CategoryController = {

  allCategories: async (req, res) => {
    try {
      const categories = await CategoryService.getCategories();

      return res.status(200).json({
        status: true,
        message: "Categories fetched successfully",
        count: categories.length,
        data: categories
      });

    } catch (error) {
      console.error("Fetch Categories Error:", error);

      return res.status(500).json({
        status: false,
        message: "Internal server error"
      });
    }
  },

  create: async (req, res) => {
    try {
      const affectedRows = await CategoryService.create(req.body);

      if (affectedRows === 0) {
        return res.status(400).json({
          status: false,
          message: "Category could not be created"
        });
      }

      return res.status(201).json({
        status: true,
        message: "Category created successfully"
      });

    } catch (error) {
      console.error("Create Category Error:", error);

      return res.status(500).json({
        status: false,
        message: "Internal server error"
      });
    }
  },

  update: async (req, res) => {
    try {
      const affectedRows = await CategoryService.update(
        req.params.id,
        req.body
      );

      if (affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: "Category not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Category updated successfully"
      });

    } catch (error) {
      console.error("Update Category Error:", error);

      return res.status(500).json({
        status: false,
        message: "Internal server error"
      });
    }
  },

  remove: async (req, res) => {
    try {
      const affectedRows = await CategoryService.remove(req.params.id);

      if (affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: "Category not found"
        });
      }

      return res.status(200).json({
        status: true,
        message: "Category deleted successfully"
      });

    } catch (error) {
      console.error("Delete Category Error:", error);

      return res.status(500).json({
        status: false,
        message: "Internal server error"
      });
    }
  }
};
