import { db } from "../db";
import { ExpenseModel } from "../models/expense.model";
import { CategoryModel } from "../models/category.model";
import { HttpError } from "../utils";

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
      throw new HttpError(400, "Invalid category");
    }

    const newExpense = await expenseModel.create(
      amount,
      userId,
      categoryId,
      description,
      date,
    );
    if (!newExpense) {
      throw new HttpError(500, "Error creating expense");
    }
    return newExpense.toObject();
  },

  async getExpensesPerUser(databaseConnection: typeof db, userId: string) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const expenses = await expenseModel.findAllByUserId(userId);
    if (!expenses) {
      throw new HttpError(404, "Could not find expenses for user");
    }
    return expenses.map((e) => e.toObject());
  },

  async getSingleExpense(
    databaseConnection: typeof db,
    expenseId: string,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const expense = await expenseModel.findById(expenseId, userId);
    if (!expense) {
      throw new HttpError(404, "Could not find expense for user");
    }

    return expense.toObject();
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
      throw new HttpError(400, "Invalid category");
    }

    const updatedExpense = await expenseModel.update(
      expenseId,
      userId,
      categoryId,
      amount,
      description,
      date,
    );
    if (!updatedExpense) {
      throw new HttpError(500, "Error updating expense");
    }

    return updatedExpense.toObject();
  },

  async deleteExpense(
    databaseConnection: typeof db,
    expenseId: string,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const existingExpense = await expenseModel.findById(expenseId, userId);
    if (!existingExpense) {
      throw new HttpError(404, "Could not find expense");
    }

    const deletedExpense = await expenseModel.delete(expenseId, userId);
    if (!deletedExpense) {
      throw new HttpError(500, "Error deleting expense");
    }

    return !!deletedExpense;
  },

  async findSheetByMonth(
    databaseConnection: typeof db,
    year: number,
    month: number,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const expensesByMonth = await expenseModel.findSheetByMonth(
      year,
      month,
      userId,
    );
    if (!expensesByMonth || expensesByMonth.length === 0) {
      return [];
    }
    return expensesByMonth.map((e) => e.toObject());
  },

  async getMonthlySummary(
    databaseConnection: typeof db,
    year: number,
    month: number,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const monthlySummary = await expenseModel.getMonthlySummary(
      year,
      month,
      userId,
    );
    if (!monthlySummary) {
      return {};
    }
    return monthlySummary;
  },

  async exportData(
    databaseConnection: typeof db,
    year: number,
    month: number,
    format: string,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const fullData = await expenseModel.findSheetByMonth(year, month, userId);

    if (format === "json") {
      const jsonRows = fullData.map((expense) => ({
        id: expense.id,
        user_id: expense.userIdValue,
        category_id: expense.categoryIdValue,
        amount: Number(expense.rawAmount),
        description: expense.currentDescription,
        date: expense.currentDate,
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
        amount: Number(expense.rawAmount),
        description: expense.currentDescription,
        date: expense.currentDate,
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

    throw new HttpError(400, "Invalid export format");
  },
};
