import { db } from "../db";
import { ExpenseModel } from "../models/expense.model";
import { CategoryModel } from "../models/category.model";

interface expenseDetails {
  categoryId: string;
  amount: number;
  description: string;
  date: string;
}

export const expenseController = {
  async createExpense(
    databaseConnection: typeof db,
    userId: string,
    expenseDetails: expenseDetails,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);
    const categoryModel = new CategoryModel(databaseConnection);

    const { amount, categoryId, description, date } = expenseDetails;
    const category = await categoryModel.findById(categoryId, userId);
    if (!category) {
      throw new Error("Invalid category");
    }

    try {
      const newExpense = await expenseModel.create(
        amount,
        userId,
        categoryId,
        description,
        date,
      );
      if (!newExpense) {
        return null;
      }
      return newExpense.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown expense registration error";
      throw new Error(message);
    }
  },

  async getExpensesPerUser(databaseConnection: typeof db, userId: string) {
    const expenseModel = new ExpenseModel(databaseConnection);

    try {
      const expenses = await expenseModel.findAllByUserId(userId);
      return expenses;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error retrieving expenses for user";
      throw new Error(message);
    }
  },

  async getSingleExpense(
    databaseConnection: typeof db,
    expenseId: string,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    try {
      const expense = await expenseModel.findById(expenseId, userId);
      if (!expense) {
        throw new Error("Could not find expense for user");
      }

      return expense.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error retrieving expense for user";
      throw new Error(message);
    }
  },

  async updateExpense(
    databaseConnection: typeof db,
    expenseId: string,
    userId: string,
    updateDetails: expenseDetails,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);
    const categoryModel = new CategoryModel(databaseConnection);

    const { categoryId, amount, description, date } = updateDetails;

    const isValidCategory = await categoryModel.findById(categoryId, userId);
    if (!isValidCategory) {
      throw new Error("Invalid category");
    }

    try {
      const updatedExpense = await expenseModel.update(
        expenseId,
        categoryId,
        amount,
        description,
        date,
      );
      if (!updatedExpense) {
        throw new Error("Error updating expense");
      }

      return updatedExpense.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error updating expense";
      throw new Error(message);
    }
  },

  async deleteExpense(
    databaseConnection: typeof db,
    expenseId: string,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const existingExpense = await expenseModel.findById(expenseId, userId);
    if (!existingExpense) {
      throw new Error("Could not find expense");
    }

    try {
      const deletedExpense = await expenseModel.delete(expenseId, userId);
      if (!deletedExpense) {
        throw new Error("Error deleting expense");
      }

      return !!deletedExpense;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error deleting expense";
      throw new Error(message);
    }
  },

  async findSheetByMonth(
    databaseConnection: typeof db,
    year: number,
    month: number,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    try {
      const expensesByMonth = await expenseModel.findSheetByMonth(
        year,
        month,
        userId,
      );
      if (!expensesByMonth || expensesByMonth.length === 0) {
        return [];
      }
      return expensesByMonth;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error gathering expense by month";
      throw new Error(message);
    }
  },

  async getMonthlySummary(
    databaseConnection: typeof db,
    year: number,
    month: number,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    try {
      const monthlySummary = await expenseModel.getMonthlySummary(
        year,
        month,
        userId,
      );
      if (!monthlySummary) {
        return {};
      }
      return monthlySummary;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error gathering monthly summary";
      throw new Error(message);
    }
  },

  async exportData(
    databaseConnection: typeof db,
    year: number,
    month: number,
    format: string,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    try {
      const fullData = await expenseModel.findSheetByMonth(year, month, userId);

      if (format === "json") {
        const jsonRows = fullData.map((expense) => ({
          id: expense.id,
          user_id: expense.userIdValue,
          category_id: expense.categoryIdValue,
          amount: Number(expense.rawAmount) / 100,
          description: expense.currentDescription,
          date: expense.currentDate.toISOString().slice(0, 10),
        }));

        return {
          data: JSON.stringify(jsonRows, null, 2),
          contentType: "application/json",
          extension: "json",
        };
      }

      if (format === "csv") {
        const headers = [
          "id",
          "user_id",
          "category_id",
          "amount",
          "description",
          "date",
        ];

        const rows = fullData.map((expense) => ({
          id: expense.id,
          user_id: expense.userIdValue,
          category_id: expense.categoryIdValue,
          amount: Number(expense.rawAmount) / 100,
          description: expense.currentDescription,
          date: expense.currentDate.toISOString().slice(0, 10),
        }));

        const csv = [
          headers.join(","),
          ...rows.map((row: Record<string, string | number>) =>
            headers
              .map((header) => {
                const value = row[header] ?? "";
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
              })
              .join(","),
          ),
        ].join("\n");

        return {
          data: csv,
          contentType: "text/csv; charset=utf-8",
          extension: "csv",
        };
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error gathering monthly summary";
      throw new Error(message);
    }
  },
};
