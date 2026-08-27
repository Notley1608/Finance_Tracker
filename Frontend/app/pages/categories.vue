<template>
  <CategoryTable
    :categories="categories"
    :is-loading="isLoading"
    :editing-id="editingCategoryId"
    @edit="updateCategory"
    @delete="deleteCategory"
    @submit="handleSubmit"
    @cancel="cancelEdit"
  >
    <template #toolbar>
      <UButton @click="createCategory">Add category</UButton>
    </template>
  </CategoryTable>
</template>

<script setup lang="ts">
import CategoryTable from "~/components/category/CategoryTable.vue";
import { useCategoryStore } from "~/stores/category";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { ref, computed, onMounted } from "vue";
import type { Category } from "~/types/categories";
import { definePageMeta } from "#imports";

definePageMeta({
  title: "Categories",
  middleware: "auth",
});

const categoryStore = useCategoryStore();

const toast = useToast();

const categories = computed(() => categoryStore.categoriesData ?? []);
const editingCategoryId = ref<string | null>(null);

const isLoading = ref(false);

const updateCategory = (category: Category) => {
  editingCategoryId.value = category.id;
};

const createCategory = async () => {
  editingCategoryId.value = null;
  const name = window.prompt("Enter category name:");
  if (!name?.trim()) return;
  try {
    await categoryStore.createCategory(name.trim());
    toast.add({ title: "Category created", color: "success" });
    await categoryStore.getAllCategories();
  } catch (error) {
    toast.add({ title: "Error creating category", color: "error" });
  }
};

const handleSubmit = async (payload: { id: string; name: string }) => {
  try {
    await categoryStore.updateCategory(payload.id, payload.name);
    toast.add({
      title: "Category updated",
      color: "success",
    });

    editingCategoryId.value = null;

    await categoryStore.getAllCategories();
  } catch (error) {
    console.error("Failed to save category:", error);
    toast.add({
      title: "Error updating category",
      color: "error",
    });
  }
};

const cancelEdit = () => {
  editingCategoryId.value = null;
};

const deleteCategory = async (category: Category) => {
  editingCategoryId.value = category.id;
  try {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category? This cannot be undone.",
    );
    if (!confirmed) return;

    await categoryStore.deleteCategory(editingCategoryId.value);
    toast.add({
      title: "Category deleted",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to delete Category: ", error);
    toast.add({
      title: "Error deleting Category",
      color: "error",
    });
  } finally {
    await categoryStore.getAllCategories();
  }
};

onMounted(async () => {
  isLoading.value = true;

  try {
    await Promise.all([categoryStore.getAllCategories()]);
  } catch (err: any) {
    toast.add({
      title: "Failed to load categories",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
});
</script>
