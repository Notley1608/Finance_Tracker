import { defineStore } from "pinia";
import { ref } from "vue";
import type { Category } from "~/types/categories";
import { useCategoriesApi } from "~/api/modules/categories";

export const useCategoryStore = defineStore("category", () => {
  const categoriesApi = useCategoriesApi();
  /**
   * category details
   * get all, get, create, update, delete
   */
  const categoriesData = ref<Category[] | null>(null);
  const categoryData = ref<Category | null>(null);
  const isLoading = ref(false);
  const error = ref(null);

  function resetState(): void {
    categoriesData.value = null;
    categoryData.value = null;
    error.value = null;
  }

  async function getAllCategories(): Promise<Category[] | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await categoriesApi.getAllCategories();
      categoriesData.value = response || null;
      return categoriesData.value;
    } catch (err: any) {
      error.value = err?.message || "Failed to load categories";
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function getCategory(categoryId: string): Promise<Category | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await categoriesApi.getCategory(categoryId);
      categoryData.value = response || null;
      return categoryData.value;
    } catch (err: any) {
      error.value = err?.message || "Failed to load category";
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function createCategory(
    categoryName: string,
  ): Promise<Category | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await categoriesApi.createCategory(categoryName);
      categoryData.value = response || null;
      return categoryData.value;
    } catch (err: any) {
      error.value = err?.message || "Failed to create category";
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCategory(
    categoryId: string,
    categoryName: string,
  ): Promise<Category | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await categoriesApi.updateCategory(
        categoryId,
        categoryName,
      );
      categoryData.value = response || null;
      return categoryData.value;
    } catch (err: any) {
      error.value = err?.message || "Failed to update category";
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteCategory(categoryId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await categoriesApi.deleteCategory(categoryId);
    } catch (err: any) {
      error.value = err?.message || "Failed to delete category";
      throw error;
    } finally {
      resetState();
      isLoading.value = false;
    }
  }

  return {
    categoriesData,
    categoryData,
    isLoading,
    error,
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    resetState,
  };
});
