import { db } from "../db";
import { CategoryModel } from "../models/category.model";
import { HttpError } from "../utils";

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
      throw new HttpError(409, "Category name already taken");
    }

    const newCategory = await categoryModel.create(categoryName, userId);
    if (!newCategory) {
      throw new HttpError(500, "Error creating category");
    }

    return newCategory.toObject();
  },

  async getCategoriesForUser(databaseConnection: typeof db, userId: string) {
    const categoryModel = new CategoryModel(databaseConnection);
    const categories = await categoryModel.findAllByUserId(userId);
    return categories;
  },

  async getSingleCategory(
    databaseConnection: typeof db,
    categoryId: string,
    userId: string,
  ) {
    const categoryModel = new CategoryModel(databaseConnection);

    const category = await categoryModel.findById(categoryId, userId);
    if (!category) {
      throw new HttpError(404, "Could not find category for user");
    }

    return category.toObject();
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
      throw new HttpError(404, "Could not find category");
    }

    const updatedCategory = await categoryModel.update(
      categoryId,
      categoryName,
      userId,
    );
    if (!updatedCategory) {
      throw new HttpError(500, "Error updating category");
    }
    return updatedCategory.toObject();
  },

  async deleteCategory(
    databaseConnection: typeof db,
    categoryId: string,
    userId: string,
  ) {
    const categoryModel = new CategoryModel(databaseConnection);

    const existingCategory = await categoryModel.findById(categoryId, userId);
    if (!existingCategory) {
      throw new HttpError(404, "Could not find category");
    }

    const deletedCategory = await categoryModel.delete(categoryId, userId);
    if (!deletedCategory) {
      throw new HttpError(500, "Error deleting category");
    }

    return !!deletedCategory;
  },
};
