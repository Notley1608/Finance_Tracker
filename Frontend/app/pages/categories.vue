<template>
  <CategoryTable
    :categories="categories"
    :is-loading="isLoading"
    @edit="updateCategory"
    @delete="deleteCategory"
  >
    <template #toolbar>
      <UButton @click="createCategory">Add category</UButton>
    </template>
  </CategoryTable>
</template>

<script setup lang="ts">
import CategoryTable from "~/components/category/CategoryTable.vue";
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { ref, computed, onMounted } from "vue";
import type { Category } from "~/types/categories";
import { definePageMeta } from "#imports";

definePageMeta({
  title: "Categories",
  middleware: "auth",
});
</script>
