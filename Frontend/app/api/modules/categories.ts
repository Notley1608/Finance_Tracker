import type { Category } from "~/types/categories";
import { createApiClient } from "~/api/client";

export function useCategoriesApi() {
  const apiClient = createApiClient();

  return {
    /**
     * METHODS:
     * create
     * getAllCategories
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
    getAllCategories(): Promise<Category[]> {
      return apiClient<Category[]>("/categories", {
        method: "GET",
      });
    },
    getCategory(categoryId: string): Promise<Category> {
      return apiClient<Category>(`/categories/${categoryId}`, {
        method: "GET",
      });
    },
    updateCategory(
      categoryId: string,
      categoryName?: string,
    ): Promise<Category> {
      return apiClient<Category>(`/categories/${categoryId}`, {
        method: "PATCH",
        body: { categoryName },
      });
    },
    deleteCategory(categoryId: string): Promise<null> {
      return apiClient<null>(`/categories/${categoryId}`, {
        method: "DELETE",
      });
    },
  };
}
