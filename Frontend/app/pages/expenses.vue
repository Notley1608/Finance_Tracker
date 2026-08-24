<template>
  <ExpenseTable
    :expenses="expenses"
    :category-map="categoryMap"
    :is-loading="isLoading"
    @edit="updateExpense"
    @delete="deleteExpense"
  >
    <template #toolbar>
      <UButton @click="createExpense">Add expense</UButton>
    </template>
  </ExpenseTable>
  <ExpenseModal
    ref="expenseModal"
    :category-map="categoryMap"
    @submit="handleSubmit"
    @cancel="cancelEdit"
  />
</template>

<script setup lang="ts">
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";
import { ref, computed, onMounted } from "vue";
import ExpenseTable from "~/components/expense/ExpenseTable.vue";
import ExpenseModal from "~/components/expense/ExpenseModal.vue";
import type { Expense, ExpensePayload } from "~/types/expenses";
import { definePageMeta } from "#imports";

definePageMeta({
  title: "Expenses",
  middleware: "auth",
});

const expenseStore = useExpenseStore();
const categoryStore = useCategoryStore();

const expenses = computed(() => expenseStore.expensesData ?? []);
const editingExpenseId = ref<string | null>(null);
const expenseModal = ref<InstanceType<typeof ExpenseModal>>();

const isLoading = ref(false);

const categoryMap = computed(() => {
  const map: Record<string, string> = {};
  categoryStore.categoriesData?.forEach((c) => {
    map[c.id] = c.name;
  });
  return map;
});
const updateExpense = (expense: Expense) => {
  expenseModal.value?.open(expense);
  editingExpenseId.value = expense.id;
};

const createExpense = async () => {
  editingExpenseId.value = null;
  expenseModal.value?.open();
};

const handleSubmit = async (payload: ExpensePayload) => {
  try {
    if (editingExpenseId.value) {
      await expenseStore.updateExpense(editingExpenseId.value, payload);
    } else {
      await expenseStore.createExpense(payload);
    }

    expenseModal.value?.close();
    editingExpenseId.value = null;

    await expenseStore.getAllExpenses();
  } catch (error) {
    console.error("Failed to save expense:", error);
  }
};

const cancelEdit = () => {
  editingExpenseId.value = null;
};

const deleteExpense = async (expense: Expense) => {
  editingExpenseId.value = expense.id;
  try {
    await expenseStore.deleteExpense(editingExpenseId.value);
  } catch (error) {
    console.error("Failed to delete expense: ", error);
  } finally {
    await expenseStore.getAllExpenses();
  }
};

onMounted(async () => {
  isLoading.value = true;

  try {
    await Promise.all([
      expenseStore.getAllExpenses(),
      categoryStore.getAllCategories(),
    ]);
  } catch (err: any) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>
