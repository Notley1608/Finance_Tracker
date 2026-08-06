import type { Expense, ExpensePayload } from "~/types/expenses";
import { createApiClient } from "~/api/client";

export function expensesApi() {
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
    deleteExpense(expenseId: string): Promise<Expense> {
      return apiClient<Expense>(`/expenses/${expenseId}`, {
        method: "DELETE",
      });
    },
  };
}
