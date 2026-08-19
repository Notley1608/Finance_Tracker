<template>
  <ExpenseTable
    :expenses="expenses"
    :category-map="categoryMap"
    :is-loading="isLoading"
  />
</template>

<script setup lang="ts">
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";
import { ref, computed, onMounted } from "vue";
import ExpenseTable from "~/components/expense/ExpenseTable.vue";
import type { Expense } from "~/types/expenses";
import { definePageMeta } from "#imports";

definePageMeta({
  title: "Expenses",
});

const expenseStore = useExpenseStore();
const categoryStore = useCategoryStore();

const expenses = ref<Expense[] | null>([]);
const isLoading = ref(false);

const categoryMap = computed(() => {
  const map: Record<string, string> = {};
  categoryStore.categoriesData?.forEach((c) => {
    map[c.id] = c.name;
  });
  return map;
});

onMounted(async () => {
  isLoading.value = true;

  try {
    await Promise.all([
      expenseStore.getAllExpenses(),
      categoryStore.getAllCategories(),
    ]);

    expenses.value = expenseStore.expensesData;
  } finally {
    isLoading.value = false;
  }
});
</script>
