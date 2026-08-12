import type { Category } from "~/types/categories";
import { createApiClient } from "~/api/client";

export function useCategoriesApi() {
  const apiClient = createApiClient();

  return {
    /**
     * METHODS:
     * getAllCategories
     * getSingleCategory
     * createCategories
     * updateCategory
     * deleteCategory
     */

    getAllCategories(): Promise<Category[]> {
      return apiClient<Category[]>("/categories", {
        method: "GET",
      });
    },
    getSingleCategory(categoryId: string): Promise<Category> {
      return apiClient<Category>(`/categories/${categoryId}`, {
        method: "GET",
      });
    },
    createCategory(categoryName: string): Promise<Category> {
      return apiClient<Category>("/categories", {
        method: "POST",
        body: categoryName,
      });
    },
    updateCategory(
      categoryId: string,
      categoryName: string,
    ): Promise<Category> {
      return apiClient<Category>(`/categories/${categoryId}`, {
        method: "PATCH",
        body: categoryName,
      });
    },
    deleteCategory(categoryId: string): Promise<boolean> {
      return apiClient<boolean>(`/categories/${categoryId}`, {
        method: "DELETE",
      });
    },
  };
}
