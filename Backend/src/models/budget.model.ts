import { db } from "../db";
import { and, eq, gte, lt, sum } from "drizzle-orm";
import { budgetSchema, expenseSchema, type BudgetSchema } from "../schemas/schema";
import { BudgetEntity } from "../entities/budget.entity";

export class BudgetModel {
  private database;
  constructor(databaseConnection: typeof db) {
    this.database = databaseConnection;
  }

  public static fromDatabase(record: BudgetSchema): BudgetEntity {
    return new BudgetEntity({
      budgetId: record.id,
      userId: record.user_id,
      categoryId: record.category_id,
      limit: record.limit,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public async upsertByCategory(
    userId: string,
    categoryId: string,
    limit: number,
  ): Promise<BudgetEntity | null> {
    const existing = await this.findByCategory(userId, categoryId);
    const now = new Date().toISOString();

    if (existing) {
      const [updated] = await this.database
        .update(budgetSchema)
        .set({ limit, updatedAt: now })
        .where(eq(budgetSchema.id, existing.id))
        .returning();
      return updated ? BudgetModel.fromDatabase(updated) : null;
    }

    const [created] = await this.database
      .insert(budgetSchema)
      .values({
        id: crypto.randomUUID(),
        user_id: userId,
        category_id: categoryId,
        limit,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created ? BudgetModel.fromDatabase(created) : null;
  }

  public async findByCategory(
    userId: string,
    categoryId: string,
  ): Promise<BudgetEntity | null> {
    const [record] = await this.database
      .select()
      .from(budgetSchema)
      .where(
        and(
          eq(budgetSchema.user_id, userId),
          eq(budgetSchema.category_id, categoryId),
        ),
      )
      .limit(1);
    return record ? BudgetModel.fromDatabase(record) : null;
  }

  public async findAll(userId: string): Promise<BudgetEntity[]> {
    const records = await this.database
      .select()
      .from(budgetSchema)
      .where(eq(budgetSchema.user_id, userId));
    return records.map((record) => BudgetModel.fromDatabase(record));
  }

  public async deleteByCategory(
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    const [deleted] = await this.database
      .delete(budgetSchema)
      .where(
        and(
          eq(budgetSchema.user_id, userId),
          eq(budgetSchema.category_id, categoryId),
        ),
      )
      .returning();
    return !!deleted;
  }

  public async spentByCategories(
    userId: string,
    startDate: string,
    endDateExclusive: string,
  ): Promise<Map<string, number>> {
    const rows = await this.database
      .select({
        categoryId: expenseSchema.category_id,
        total: sum(expenseSchema.amount),
      })
      .from(expenseSchema)
      .where(
        and(
          eq(expenseSchema.user_id, userId),
          eq(expenseSchema.type, "expense"),
          gte(expenseSchema.date, startDate),
          lt(expenseSchema.date, endDateExclusive),
        ),
      )
      .groupBy(expenseSchema.category_id);

    const result = new Map<string, number>();
    for (const row of rows) {
      if (row.categoryId) {
        result.set(row.categoryId, Number(row.total ?? 0));
      }
    }
    return result;
  }
}