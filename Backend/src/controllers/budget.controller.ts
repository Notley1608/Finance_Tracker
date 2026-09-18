import { db } from "../db";
import { BudgetModel } from "../models/budget.model";
import { CategoryModel } from "../models/category.model";
import { HttpError } from "../utils";

export const budgetController = {
  async listBudgets(
    databaseConnection: typeof db,
    userId: string,
    year: number,
    month: number,
  ) {
    const budgetModel = new BudgetModel(databaseConnection);
    const categoryModel = new CategoryModel(databaseConnection);

    const budgets = await budgetModel.findAll(userId);
    if (budgets.length === 0) {
      return [];
    }

    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const spentByCategory = await budgetModel.spentByCategories(
      userId,
      startOfMonth,
      endOfMonth,
    );

    const items = [];
    for (const budget of budgets) {
      const category = await categoryModel.findById(
        budget.categoryIdValue,
        userId,
      );
      const spent = spentByCategory.get(budget.categoryIdValue) ?? 0;
      const limit = budget.limitValue;

      items.push({
        id: budget.id,
        categoryId: budget.categoryIdValue,
        categoryName: category?.name ?? null,
        categoryColour: category?.colour ?? null,
        limit,
        month: `${year}-${String(month).padStart(2, "0")}`,
        spent,
        remaining: limit - spent,
        percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      });
    }

    return items;
  },

  async upsertBudget(
    databaseConnection: typeof db,
    userId: string,
    categoryId: string,
    limit: number,
  ) {
    const budgetModel = new BudgetModel(databaseConnection);
    const categoryModel = new CategoryModel(databaseConnection);

    const category = await categoryModel.findById(categoryId, userId);
    if (!category) {
      throw new HttpError(400, "Invalid category");
    }

    const budget = await budgetModel.upsertByCategory(userId, categoryId, limit);
    if (!budget) {
      throw new HttpError(500, "Error saving budget");
    }
    return budget.toObject();
  },

  async deleteBudget(
    databaseConnection: typeof db,
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    const budgetModel = new BudgetModel(databaseConnection);

    const deleted = await budgetModel.deleteByCategory(userId, categoryId);
    if (!deleted) {
      throw new HttpError(404, "Budget not found");
    }
    return deleted;
  },
};