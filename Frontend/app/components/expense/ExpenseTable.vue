<template>
  <UTable class="flex flex-1" :data="expenseData" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Expense } from "~/types/expenses";
import type { Category } from "~/types/categories";

const props = defineProps<{
  expenses: Expense[] | null;
  categories: Category[] | null;
  isLoading: boolean;
}>();
const emit = defineEmits(["edit", "delete"]);

console.log(props.categories);

const expenseData = computed(() =>
  props.expenses?.map((expense) => ({
    description: expense.description,
    amount: expense.amount,
    category:
      props.categories?.find((category) => category.id === expense.categoryId)
        ?.name ?? "Unknown",
    date: expense.date,
  })),
);
</script>
