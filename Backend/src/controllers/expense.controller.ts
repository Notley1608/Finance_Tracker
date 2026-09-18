import { db } from "../db";
import { ExpenseModel, type ExpenseFilters } from "../models/expense.model";
import { CategoryModel } from "../models/category.model";
import { ExpenseEntity } from "../entities/expense.entity";
import { HttpError, escapeCsvCell } from "../utils";
import { occurrencesForMonth } from "../utils/recurrence";

interface expenseDetails {
  categoryId?: string | null;
  amount: number;
  description: string;
  date: string;
  type?: "expense" | "income";
  recurrence?: "none" | "weekly" | "monthly" | "yearly";
}

export const expenseController = {
  async createExpense(
    databaseConnection: typeof db,
    userId: string,
    expenseDetails: expenseDetails,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);
    const categoryModel = new CategoryModel(databaseConnection);

    const { amount, categoryId, description, date, type, recurrence } =
      expenseDetails;
    const isIncome = type === "income";

    if (!isIncome && !categoryId) {
      throw new HttpError(400, "Category is required for expenses");
    }
    if (categoryId) {
      const category = await categoryModel.findById(categoryId, userId);
      if (!category) {
        throw new HttpError(400, "Invalid category");
      }
    }

    const newExpense = await expenseModel.create(
      amount,
      userId,
      description,
      date,
      categoryId ?? null,
      type ?? "expense",
      recurrence ?? "none",
    );
    if (!newExpense) {
      throw new HttpError(500, "Error creating expense");
    }
    return newExpense.toObject();
  },

  async getExpensesPerUser(
    databaseConnection: typeof db,
    userId: string,
    filters: ExpenseFilters,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const result = await expenseModel.findAllByUserId(userId, filters);
    if (!result) {
      throw new HttpError(404, "Could not find expenses for user");
    }

    return {
      items: result.items.map((e) => e.toObject()),
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(result.total / filters.pageSize),
    };
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

    const { categoryId, amount, description, date, type, recurrence } =
      updateDetails;
    const isIncome = type === "income";

    if (!isIncome && !categoryId) {
      throw new HttpError(400, "Category is required for expenses");
    }
    if (categoryId) {
      const isValidCategory = await categoryModel.findById(categoryId, userId);
      if (!isValidCategory) {
        throw new HttpError(400, "Invalid category");
      }
    }

    const updatedExpense = await expenseModel.update(
      expenseId,
      userId,
      categoryId,
      amount,
      description,
      date,
      type,
      recurrence,
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
    includeRecurring = false,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    const physicalRows = await expenseModel.findSheetByMonth(year, month, userId);

    if (!includeRecurring) {
      return physicalRows.map((e) => e.toObject());
    }

    const projected = await this.projectRecurringForMonth(
      databaseConnection,
      year,
      month,
      userId,
    );

    return [...physicalRows.map((e) => e.toObject()), ...projected];
  },

  async getMonthlySummary(
    databaseConnection: typeof db,
    year: number,
    month: number,
    userId: string,
    includeRecurring = false,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);
    const categoryModel = new CategoryModel(databaseConnection);

    let monthlySummary = await expenseModel.getMonthlySummary(
      year,
      month,
      userId,
    );

    if (includeRecurring) {
      const projected = await this.projectRecurringForMonth(
        databaseConnection,
        year,
        month,
        userId,
      );
      const recurringExpenses = projected
        .filter((e) => e.currentType === "expense")
        .reduce((sumSoFar, e) => sumSoFar + e.rawAmount, 0);
      const recurringIncome = projected
        .filter((e) => e.currentType === "income")
        .reduce((sumSoFar, e) => sumSoFar + e.rawAmount, 0);

      monthlySummary = {
        ...monthlySummary,
        totalSpent: monthlySummary.totalSpent + recurringExpenses,
        totalIncome: monthlySummary.totalIncome + recurringIncome,
        netTotal:
          monthlySummary.totalIncome +
          recurringIncome -
          (monthlySummary.totalSpent + recurringExpenses),
      };
    }

    const withCategoryNames = [];
    for (const entry of monthlySummary.categories) {
      let categoryName: string | null = null;
      if (entry.categoryId) {
        const category = await categoryModel.findById(entry.categoryId, userId);
        categoryName = category?.name ?? null;
      }
      withCategoryNames.push({ ...entry, categoryName });
    }

    return { ...monthlySummary, categories: withCategoryNames };
  },

  /** Builds projected recurring occurrences for the given month. */
  async projectRecurringForMonth(
    databaseConnection: typeof db,
    year: number,
    month: number,
    userId: string,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);
    const templates = await expenseModel.findRecurringTemplates(userId);
    const projected: ExpenseEntity[] = [];

    for (const template of templates) {
      const occurrences = occurrencesForMonth(
        template.currentDate,
        template.currentRecurrence,
        year,
        month - 1,
      );
      for (const occurrence of occurrences) {
        projected.push(
          new ExpenseEntity({
            expenseId: `${template.id}:${occurrence.replace(/-/g, "")}:proj`,
            userId: template.userIdValue,
            categoryId: template.categoryIdValue,
            amount: template.rawAmount,
            description: template.currentDescription,
            date: new Date(`${occurrence}T00:00:00Z`),
            type: template.currentType,
            recurrence: "none",
          }),
        );
      }
    }

    return projected;
  },

  async exportData(
    databaseConnection: typeof db,
    year: number,
    month: number,
    format: string,
    userId: string,
    includeRecurring = false,
  ) {
    const expenseModel = new ExpenseModel(databaseConnection);

    let fullData = await expenseModel.findSheetByMonth(year, month, userId);
    if (includeRecurring) {
      const projected = await this.projectRecurringForMonth(
        databaseConnection,
        year,
        month,
        userId,
      );
      fullData = [...fullData, ...projected];
    }

    if (format === "json") {
      return {
        data: JSON.stringify(fullData.map(rowForExport), null, 2),
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
        "type",
      ];

      const rows = fullData.map(rowForExport);

      const csv = [
        headers.map(escapeCsvCell).join(","),
        ...rows.map((row: Record<string, string | number>) =>
          headers.map((header) => escapeCsvCell(row[header])).join(","),
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

function rowForExport(expense: ExpenseEntity) {
  return {
    id: expense.id,
    user_id: expense.userIdValue,
    category_id: expense.categoryIdValue ?? "",
    amount: Number(expense.rawAmount),
    description: expense.currentDescription,
    date: expense.currentDate,
    type: expense.currentType,
  };
}