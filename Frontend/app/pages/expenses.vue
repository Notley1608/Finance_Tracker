<template>
  <ExpenseTable
    :expenses="expenses"
    :categories="categories"
    :is-loading="isLoading"
  />
</template>

<script setup lang="ts">
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";
import { ref, computed, onMounted } from "vue";
import ExpenseTable from "~/components/expense/ExpenseTable.vue";
import type { Expense } from "~/types/expenses";
import type { Category } from "~/types/categories";
import { definePageMeta } from "#imports";

definePageMeta({
  title: "Expenses",
});

const expenseStore = useExpenseStore();
const categoryStore = useCategoryStore();

const expenses = ref<Expense[] | null>([]);
const categories = ref<Category[] | null>([]);
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;

  try {
    const [expenseResult, categoryResult] = await Promise.all([
      expenseStore.getAllExpenses(),
      categoryStore.getAllCategories(),
    ]);

    expenses.value = expenseResult;
    categories.value = categoryResult;

    console.log("expenses", expenses.value);
    console.log("categories", categories.value);
  } finally {
    isLoading.value = false;
  }
});
</script>
