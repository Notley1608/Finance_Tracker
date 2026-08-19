import { defineStore } from "pinia";
import { ref } from "vue";
import type { Expense, ExpensePayload } from "~/types/expenses";
import { useExpensesApi } from "~/api/modules/expenses";

export const useExpenseStore = defineStore(
  "expense",
  () => {
    const expensesApi = useExpensesApi();

    /**
     * Expense details
     * exporting data
     * monthly summaries & sheets
     * loading/error/success states
     * methods:
     * get all, create, update, delete, monthlySum, monthlySheet, export
     */

    const expensesData = ref<Expense[] | null>(null);
    const expenseData = ref<Expense | null>(null);
    const isLoading = ref(false);
    const error = ref(null);

    function resetState(): void {
      expensesData.value = null;
      expenseData.value = null;
      error.value = null;
    }

    async function getAllExpenses(): Promise<Expense[] | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.getAllExpenses();
        expensesData.value = response || null;
        return expensesData.value;
      } catch (err: any) {
        error.value = err?.message || "Failed to load expenses";
        throw error;
      } finally {
        isLoading.value = false;
      }
    }

    async function createExpense(
      payload: ExpensePayload,
    ): Promise<Expense | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.createExpense(payload);
        expenseData.value = response || null;
        return expenseData.value;
      } catch (err: any) {
        error.value = err?.message || "Failed to create expenses";
        throw error;
      } finally {
        isLoading.value = false;
      }
    }

    async function getSingleExpense(
      expenseId: string,
    ): Promise<Expense | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.getExpense(expenseId);
        expenseData.value = response || null;
        return expenseData.value;
      } catch (err: any) {
        error.value = err.message || "Error getting expense";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function updateExpense(
      expenseId: string,
      payload: ExpensePayload,
    ): Promise<Expense | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.updateExpense(expenseId, payload);
        expenseData.value = response || null;
        return expenseData.value;
      } catch (err: any) {
        error.value = err.message || "Error updating expense";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function deleteExpense(expenseId: string): Promise<boolean> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.deleteExpense(expenseId);
        return response.success;
      } catch (err: any) {
        error.value = err.message || "Error deleting expense";
        throw err;
      } finally {
        resetState();
        isLoading.value = false;
      }
    }

    async function getMonthlySheet(
      year: number,
      month: number,
    ): Promise<Expense[] | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.getMonthlySheet(year, month);
        expensesData.value = response || null;
        return expensesData.value;
      } catch (err: any) {
        error.value = err.message || "Error getting monthly sheet";
        throw err;
      } finally {
        resetState();
        isLoading.value = false;
      }
    }

    async function getMonthlySummary(
      year: number,
      month: number,
    ): Promise<Expense[] | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.getMonthlySummary(year, month);
        expensesData.value = response || null;
        return expensesData.value;
      } catch (err: any) {
        error.value = err.message || "Error getting monthly summary";
        throw err;
      } finally {
        resetState();
        isLoading.value = false;
      }
    }

    async function exportData(
      year: number,
      month: number,
      format: string,
    ): Promise<Blob | Expense[]> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await expensesApi.exportData(year, month, format);
        return response;
      } catch (err: any) {
        error.value = err.message || "Error exporting data";
        throw err;
      } finally {
        resetState();
        isLoading.value = false;
      }
    }

    return {
      expensesData,
      expenseData,
      isLoading,
      error,
      getAllExpenses,
      createExpense,
      getSingleExpense,
      updateExpense,
      deleteExpense,
      getMonthlySheet,
      getMonthlySummary,
      exportData,
    };
  },
  {
    persist: {
      paths: ["expenseData"],
    },
  } as any,
);
