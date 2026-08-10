import type { Expense, ExpensePayload } from "~/types/expenses";
import { createApiClient } from "~/api/client";

export function useExpensesApi() {
  const apiClient = createApiClient();

  return {
    /**
     * METHfODS:
     * createExpense
     * getAllExpenses
     * getMonthlySheet
     * getMonthlySummary
     * getExpense
     * updateExpense
     * deleteExpense
     * exportData
     */
    createExpense(payload: ExpensePayload): Promise<Expense> {
      return apiClient<Expense>("/expenses", {
        method: "POST",
        body: payload,
      });
    },
    getAllExpenses(): Promise<Expense[]> {
      return apiClient<Expense[]>("/expenses", {
        method: "GET",
      });
    },
    getMonthlySheet(year: number, month: number): Promise<Expense[]> {
      return apiClient<Expense[]>("/expenses/monthly-sheet", {
        method: "GET",
        query: { year, month },
      });
    },
    getMonthlySummary(year: number, month: number): Promise<Expense[]> {
      return apiClient<Expense[]>("/expenses/monthly-summary", {
        method: "GET",
        query: { year, month },
      });
    },
    getExpense(expenseId: string): Promise<Expense> {
      return apiClient<Expense>(`/expenses/${expenseId}`, {
        method: "GET",
      });
    },
    updateExpense(
      expenseId: string,
      payload: ExpensePayload,
    ): Promise<Expense> {
      return apiClient<Expense>(`/expenses/${expenseId}`, {
        method: "PATCH",
        body: payload,
      });
    },
    deleteExpense(expenseId: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/expenses/${expenseId}`, {
        method: "DELETE",
      });
    },
    exportData(
      year: number,
      month: number,
      format: string,
    ): Promise<Blob | Expense[]> {
      return apiClient<Blob | Expense[]>(
        `/expenses/export?year=${year}&month=${month}&format=${format}`,
        {
          method: "GET",
        },
      );
    },
  };
}
