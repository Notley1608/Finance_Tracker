import { db } from "../db";
import { expenseSchema, type ExpenseSchema } from "../schemas/schema";
import { ExpenseEntity } from "../entities/expense.entity";
import { and, eq, gte, lt, sum, sql } from "drizzle-orm";

export class ExpenseModel {
  /**methods
   * create
   * update
   * delete
   * getExpensesByUserId
   * findSheetByMonth
   * getMonthlySummary
   */

  private database;
  constructor(databaseConnection: typeof db) {
    this.database = databaseConnection;
  }

  public static fromDatabase(dbRecord: ExpenseSchema): ExpenseEntity {
    return new ExpenseEntity({
      expenseId: dbRecord.id,
      userId: dbRecord.user_id,
      categoryId: dbRecord.category_id,
      amount: dbRecord.amount,
      description: dbRecord.description ?? "",
      date: new Date(dbRecord.date),
    });
  }

  public async create(
    amount: number,
    activeUserId: string,
    categoryId: string,
    description: string,
    date: string,
  ): Promise<ExpenseEntity | null> {
    try {
      const [newExpense] = await this.database
        .insert(expenseSchema)
        .values({
          id: crypto.randomUUID(),
          user_id: activeUserId,
          category_id: categoryId,
          amount: amount,
          description: description,
          date: date,
        })
        .returning();
      if (!newExpense) {
        return null;
      }

      return new ExpenseEntity({
        expenseId: newExpense.id,
        userId: newExpense.user_id,
        categoryId: newExpense.category_id,
        amount: newExpense.amount,
        description: newExpense.description ?? "",
        date: new Date(newExpense.date),
      });
    } catch (error) {
      console.error("DB insertion failed: ", error);
      return null;
    }
  }

  public async findById(
    expenseId: string,
    userId: string,
  ): Promise<ExpenseEntity | null> {
    const [record] = await this.database
      .select()
      .from(expenseSchema)
      .where(
        and(eq(expenseSchema.id, expenseId), eq(expenseSchema.user_id, userId)),
      )
      .limit(1);
    return record ? ExpenseModel.fromDatabase(record) : null;
  }

  public async update(
    expenseId: string,
    userId: string,
    categoryId?: string,
    amount?: number,
    description?: string,
    date?: string,
  ): Promise<ExpenseEntity | null> {
    const existingRecord = await this.database
      .select()
      .from(expenseSchema)
      .where(
        and(eq(expenseSchema.id, expenseId), eq(expenseSchema.user_id, userId)),
      );

    if (existingRecord.length === 0) {
      console.error("Could not find expense");
      return null;
    }

    const updateFields: Partial<ExpenseSchema> = {};

    if (categoryId !== undefined) {
      updateFields.category_id = categoryId;
    }
    if (amount !== undefined) {
      updateFields.amount = amount;
    }
    if (description !== undefined) {
      updateFields.description = description;
    }
    if (date !== undefined) {
      updateFields.date = date;
    }

    try {
      const updatedRecords = await this.database
        .update(expenseSchema)
        .set(updateFields)
        .where(eq(expenseSchema.id, expenseId))
        .returning();
      if (!updatedRecords || updatedRecords.length === 0) return null;

      const newRecord = updatedRecords[0];
      if (!newRecord) {
        console.error("Could not find or update expense wth ID: ", expenseId);
        return null;
      }

      return new ExpenseEntity({
        expenseId: newRecord.id,
        userId: newRecord.user_id,
        categoryId: newRecord.category_id,
        amount: newRecord.amount,
        description: newRecord.description ?? "",
        date: new Date(newRecord.date),
      });
    } catch (error) {
      console.error("Error updating expense: ", error);
      return null;
    }
  }

  public async delete(
    expenseId: string,
    userId: string,
  ): Promise<boolean | null> {
    try {
      const [deletedExpense] = await this.database
        .delete(expenseSchema)
        .where(
          and(
            eq(expenseSchema.id, expenseId),
            eq(expenseSchema.user_id, userId),
          ),
        )
        .returning();
      return !!deletedExpense;
    } catch (error) {
      console.log("Error deleting expense: ", error);
      return null;
    }
  }

  public async findAllByUserId(
    userId: string,
  ): Promise<ExpenseEntity[] | null> {
    const records = await this.database
      .select()
      .from(expenseSchema)
      .where(eq(expenseSchema.user_id, userId));

    if (!records || records.length === 0) return [];

    return records.map((record: ExpenseSchema) => {
      return new ExpenseEntity({
        expenseId: record.id,
        userId: record.user_id,
        categoryId: record.category_id,
        amount: record.amount,
        description: record.description ?? "",
        date: new Date(record.date),
      });
    });
  }

  public async findSheetByMonth(
    year: number,
    month: number,
    userId: string,
  ): Promise<ExpenseEntity[]> {
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const startOfNextMonth = new Date(year, month, 1).toISOString();

    try {
      const records = await this.database
        .select()
        .from(expenseSchema)
        .where(
          and(
            eq(expenseSchema.user_id, userId),
            gte(expenseSchema.date, startOfMonth),
            lt(expenseSchema.date, startOfNextMonth),
          ),
        );
      if (!records) {
        console.log("No records found within those bounds");
        return [];
      }

      return records.map((record) => {
        return new ExpenseEntity({
          expenseId: record.id,
          userId: record.user_id,
          categoryId: record.category_id,
          amount: record.amount,
          description: record.description ?? "",
          date: new Date(record.date),
        });
      });
    } catch (error) {
      console.error("Error finding expenses for that month: ", error);
      return [];
    }
  }

  public async getMonthlySummary(
    year: number,
    month: number,
    userId: string,
  ): Promise<{
    year: number;
    month: number;
    totalSpent: number;
    categories: Array<{ categoryId: string; amountSpent: number }>;
  }> {
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const startOfNextMonth = new Date(year, month, 1).toISOString();

    try {
      const totalResult = await this.database
        .select({ totalCents: sum(expenseSchema.amount) })
        .from(expenseSchema)
        .where(
          and(
            eq(expenseSchema.user_id, userId),
            gte(expenseSchema.date, startOfMonth),
            lt(expenseSchema.date, startOfNextMonth),
          ),
        );
      const totalCents = totalResult[0]?.totalCents ?? 0;
      const totalSpentDollar = Number(totalCents) / 100;

      const categoryResult = await this.database
        .select({
          categoryId: expenseSchema.category_id,
          centsSpent: sum(expenseSchema.amount),
        })
        .from(expenseSchema)
        .where(
          and(
            eq(expenseSchema.user_id, userId),
            gte(expenseSchema.date, startOfMonth),
            lt(expenseSchema.date, startOfNextMonth),
          ),
        )
        .groupBy(expenseSchema.category_id);

      const categoriesBreakdown = categoryResult.map((row) => {
        const rawCategoryCents = row.centsSpent
          ? parseInt(row.centsSpent, 10)
          : 0;
        return {
          categoryId: row.categoryId,
          amountSpent: rawCategoryCents / 100,
        };
      });

      return {
        year,
        month,
        totalSpent: totalSpentDollar,
        categories: categoriesBreakdown,
      };
    } catch (error) {
      console.error("Error calculating summary for that month: ", error);
      return {
        year,
        month,
        totalSpent: 0,
        categories: [],
      };
    }
  }
}
