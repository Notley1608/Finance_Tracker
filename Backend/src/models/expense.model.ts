import { db } from "../db";
import { expenseSchema, type ExpenseSchema } from "../schemas/schema";
import {
  ExpenseEntity,
  type ExpenseType,
  type RecurrencePattern,
} from "../entities/expense.entity";
import { and, asc, count, desc, eq, gte, like, lt, lte, ne, sum } from "drizzle-orm";

export interface ExpenseFilters {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: ExpenseType;
  sortBy?: "date" | "amount" | "description";
  sortOrder?: "asc" | "desc";
}

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
      type: dbRecord.type,
      recurrence: dbRecord.recurrence,
    });
  }

  public async create(
    amount: number,
    activeUserId: string,
    description: string,
    date: string,
    categoryId?: string | null,
    type: ExpenseType = "expense",
    recurrence: RecurrencePattern = "none",
  ): Promise<ExpenseEntity | null> {
    const [newExpense] = await this.database
      .insert(expenseSchema)
      .values({
        id: crypto.randomUUID(),
        user_id: activeUserId,
        category_id: categoryId ?? null,
        amount: amount,
        description: description,
        date: date,
        type: type,
        recurrence: recurrence,
      })
      .returning();
    if (!newExpense) {
      return null;
    }

    return ExpenseModel.fromDatabase(newExpense);
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
    categoryId?: string | null,
    amount?: number,
    description?: string,
    date?: string,
    type?: ExpenseType,
    recurrence?: RecurrencePattern,
  ): Promise<ExpenseEntity | null> {
    const existingRecord = await this.database
      .select()
      .from(expenseSchema)
      .where(
        and(eq(expenseSchema.id, expenseId), eq(expenseSchema.user_id, userId)),
      );

    if (existingRecord.length === 0) {
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
    if (type !== undefined) {
      updateFields.type = type;
    }
    if (recurrence !== undefined) {
      updateFields.recurrence = recurrence;
    }

    const updatedRecords = await this.database
      .update(expenseSchema)
      .set(updateFields)
      .where(
        and(eq(expenseSchema.id, expenseId), eq(expenseSchema.user_id, userId)),
      )
      .returning();
    if (!updatedRecords || updatedRecords.length === 0) return null;

    return ExpenseModel.fromDatabase(updatedRecords[0] as ExpenseSchema);
  }

  public async delete(
    expenseId: string,
    userId: string,
  ): Promise<boolean | null> {
    const [deletedExpense] = await this.database
      .delete(expenseSchema)
      .where(
        and(eq(expenseSchema.id, expenseId), eq(expenseSchema.user_id, userId)),
      )
      .returning();
    return !!deletedExpense;
  }

  public async findAllByUserId(
    userId: string,
    filters: ExpenseFilters = { page: 1, pageSize: 20 },
  ): Promise<{ items: ExpenseEntity[]; total: number }> {
    const conditions = [eq(expenseSchema.user_id, userId)];

    if (filters.search) {
      conditions.push(like(expenseSchema.description, `%${filters.search}%`));
    }
    if (filters.categoryId) {
      conditions.push(eq(expenseSchema.category_id, filters.categoryId));
    }
    if (filters.dateFrom) {
      conditions.push(gte(expenseSchema.date, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(expenseSchema.date, filters.dateTo));
    }
    if (filters.type) {
      conditions.push(eq(expenseSchema.type, filters.type));
    }

    const where = and(...conditions);

    const counted = await this.database
      .select({ total: count() })
      .from(expenseSchema)
      .where(where);
    const total = counted[0]?.total ?? 0;

    const orderColumn =
      filters.sortBy === "amount"
        ? expenseSchema.amount
        : filters.sortBy === "description"
          ? expenseSchema.description
          : expenseSchema.date;
    const orderFn = filters.sortOrder === "asc" ? asc : desc;

    const records = await this.database
      .select()
      .from(expenseSchema)
      .where(where)
      .orderBy(orderFn(orderColumn))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    return {
      items: records.map((record) => ExpenseModel.fromDatabase(record)),
      total,
    };
  }

  public async findSheetByMonth(
    year: number,
    month: number,
    userId: string,
  ): Promise<ExpenseEntity[]> {
    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    return this.findInRange(userId, startOfMonth, startOfNextMonth, "desc");
  }

  public async findInRange(
    userId: string,
    startDate: string,
    endDateExclusive: string,
    sortOrder: "asc" | "desc" = "asc",
  ): Promise<ExpenseEntity[]> {
    const records = await this.database
      .select()
      .from(expenseSchema)
      .where(
        and(
          eq(expenseSchema.user_id, userId),
          gte(expenseSchema.date, startDate),
          lt(expenseSchema.date, endDateExclusive),
        ),
      )
      .orderBy(sortOrder === "asc" ? asc(expenseSchema.date) : desc(expenseSchema.date));
    if (!records) {
      return [];
    }

    return records.map((record) => ExpenseModel.fromDatabase(record));
  }

  public async findRecurringTemplates(userId: string): Promise<ExpenseEntity[]> {
    const records = await this.database
      .select()
      .from(expenseSchema)
      .where(
        and(
          eq(expenseSchema.user_id, userId),
          ne(expenseSchema.recurrence, "none"),
        ),
      );
    return records.map((record) => ExpenseModel.fromDatabase(record));
  }

  public async getMonthlySummary(
    year: number,
    month: number,
    userId: string,
  ): Promise<{
    year: number;
    month: number;
    totalSpent: number;
    totalIncome: number;
    netTotal: number;
    categories: Array<{ categoryId: string | null; amountSpent: number }>;
  }> {
    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const range = [
      eq(expenseSchema.user_id, userId),
      gte(expenseSchema.date, startOfMonth),
      lt(expenseSchema.date, startOfNextMonth),
    ];

    const spendResult = await this.database
      .select({ totalAmount: sum(expenseSchema.amount) })
      .from(expenseSchema)
      .where(and(...range, eq(expenseSchema.type, "expense")));
    const incomeResult = await this.database
      .select({ totalAmount: sum(expenseSchema.amount) })
      .from(expenseSchema)
      .where(and(...range, eq(expenseSchema.type, "income")));

    const totalSpent = Number(spendResult[0]?.totalAmount ?? 0);
    const totalIncome = Number(incomeResult[0]?.totalAmount ?? 0);

    const categoryResult = await this.database
      .select({
        categoryId: expenseSchema.category_id,
        amountSpent: sum(expenseSchema.amount),
      })
      .from(expenseSchema)
      .where(and(...range, eq(expenseSchema.type, "expense")))
      .groupBy(expenseSchema.category_id);

    const categoriesBreakdown = categoryResult.map((row) => ({
      categoryId: row.categoryId,
      amountSpent: row.amountSpent ? Number(row.amountSpent) : 0,
    }));

    return {
      year,
      month,
      totalSpent,
      totalIncome,
      netTotal: totalIncome - totalSpent,
      categories: categoriesBreakdown,
    };
  }
}