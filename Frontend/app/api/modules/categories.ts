import type { Category } from "~/types/categories";
import { apiClient } from "../client";

export const categoriesApi = {
  /**
   * METHODS:
   * create
   * getAllExpenses
   * getCategory
   * updateCategory
   * deleteCategory
   */
  createCategory(categoryName: string): Promise<Category> {
    return apiClient<Category>("/categories", {
      method: "POST",
      body: { categoryName },
    });
  },
  getAllExpenses(): Promise<Category[]> {
    return apiClient<Category[]>("/categories", {
      method: "GET",
    });
  },
  getCategory(categoryId: string): Promise<Category> {
    return apiClient<Category>(`categories/${categoryId}`, {
      method: "GET",
    });
  },
  updateCategory(categoryId: string, categoryName?: string): Promise<Category> {
    return apiClient<Category>(`/categories/${categoryId}`, {
      method: "PATCH",
      body: { categoryName },
    });
  },
  deleteCategory(categoryId: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/categories/${categoryId}`, {
      method: "DELETE",
    });
  },
};
