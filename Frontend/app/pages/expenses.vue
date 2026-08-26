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
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
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

const toast = useToast();

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
      toast.add({
        title: "Expense updated",
        color: "success",
      });
    } else {
      await expenseStore.createExpense(payload);
      toast.add({
        title: "Expense created",
        color: "success",
      });
    }

    expenseModal.value?.close();
    editingExpenseId.value = null;

    await expenseStore.getAllExpenses();
  } catch (error) {
    console.error("Failed to save expense:", error);
    toast.add({
      title: "Error updating expense",
      color: "error",
    });
  }
};

const cancelEdit = () => {
  editingExpenseId.value = null;
};

const deleteExpense = async (expense: Expense) => {
  editingExpenseId.value = expense.id;
  try {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense? This cannot be undone.",
    );
    if (!confirmed) return;

    await expenseStore.deleteExpense(editingExpenseId.value);
    toast.add({
        title: "Expense deleted",
        color: "success",
      });
  } catch (error) {
    console.error("Failed to delete expense: ", error);
    toast.add({
      title: "Error deleting expense",
      color: "error",
    });
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
    toast.add({
      title: "Failed to load expenses",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
});
</script>
