import { db } from "../db";
import { CategoryModel } from "../models/category.model";

export const categoryController = {
  async createCategory(
    databaseConnection: typeof db,
    userId: string,
    categoryName: string,
  ) {
    const categoryModel = new CategoryModel(databaseConnection);
    const existingCategory = await categoryModel.findByName(
      userId,
      categoryName,
    );
    if (existingCategory) {
      throw new Error("Category name already taken");
    }

    try {
      const newCategory = await categoryModel.create(categoryName, userId);
      if (!newCategory) {
        throw new Error("Error creating category");
      }

      return newCategory.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown category registration error";
      throw new Error(message);
    }
  },

  async getCategoriesForUser(databaseConnection: typeof db, userId: string) {
    const categoryModel = new CategoryModel(databaseConnection);
    try {
      const categories = await categoryModel.findAllByUserId(userId);
      return categories;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error retrieving categories for user";
      throw new Error(message);
    }
  },

  async getSingleCategory(
    databaseConnection: typeof db,
    categoryId: string,
    userId: string,
  ) {
    const categoryModel = new CategoryModel(databaseConnection);

    try {
      const category = await categoryModel.findById(categoryId, userId);
      if (!category) {
        throw new Error("Could not find category for user");
      }

      return category.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error retrieving category for user";
      throw new Error(message);
    }
  },

  async updateCategory(
    databaseConnection: typeof db,
    categoryName: string,
    categoryId: string,
    userId: string,
  ) {
    const categoryModel = new CategoryModel(databaseConnection);
    const existingCategory = await categoryModel.findById(categoryId, userId);
    if (!existingCategory) {
      throw new Error("Could not find category");
    }

    try {
      const updatedCategory = await categoryModel.update(
        categoryId,
        categoryName,
        userId,
      );
      if (!updatedCategory) {
        throw new Error("Error updating category");
      }
      return updatedCategory.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error updating category";
      throw new Error(message);
    }
  },

  async deleteCategory(
    databaseConnection: typeof db,
    categoryId: string,
    userId: string,
  ) {
    const categoryModel = new CategoryModel(databaseConnection);

    const existingCategory = await categoryModel.findById(categoryId, userId);
    if (!existingCategory) {
      throw new Error("Could not find category");
    }

    try {
      const deletedCategory = await categoryModel.delete(categoryId, userId);
      if (!deletedCategory) {
        throw new Error("Error deleting category");
      }

      return !!deletedCategory;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error deleting category";
      throw new Error(message);
    }
  },
};
