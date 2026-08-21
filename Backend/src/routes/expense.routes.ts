import { Elysia, t } from "elysia";
import { db } from "../db";
import { expenseController } from "../controllers/expense.controller";
import { HttpError } from "../utils/utils";
import { jwtMiddleware, authDerive, authResolve } from "../middleware/auth";

export const expenseRoutes = new Elysia({ prefix: "/expenses" })
  .decorate("db", db)
  .use(jwtMiddleware)
  .derive(authDerive)
  .resolve(authResolve)
  .post(
    "/",
    async ({ db, body, userId, set }) => {
      const { categoryId, amount, description, date } = body as {
        categoryId: string;
        amount: number;
        description: string;
        date: string;
      };

      try {
        const newExpense = await expenseController.createExpense(db, userId, {
          categoryId,
          amount,
          description,
          date,
        });
        if (!newExpense) {
          throw new Error("Error creating expense");
        }
        set.status = 201;
        return newExpense;
      } catch (err: any) {
        console.error("Expense creation error: ", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      body: t.Object({
        categoryId: t.String({ format: "uuid" }),
        amount: t.Number(),
        description: t.String(),
        date: t.String(),
      }),
    },
  )

  .get("/", async ({ db, userId }) => {
    try {
      const expenses = await expenseController.getExpensesPerUser(db, userId);
      return expenses;
    } catch (err) {
      console.error("Error retrieving expenses for user: ", err);
      throw new HttpError(500, "Internal server error");
    }
  })

  .get(
    "/monthly-sheet",
    async ({ db, query, userId }) => {
      const { year, month } = query as { year: number; month: number };

      try {
        return await expenseController.findSheetByMonth(
          db,
          year,
          month,
          userId,
        );
      } catch (err) {
        console.error("Error retrieving expenses for user: ", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      query: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
      }),
    },
  )

  .get(
    "/monthly-summary",
    async ({ db, query, userId }) => {
      const { year, month } = query as { year: number; month: number };

      try {
        return await expenseController.getMonthlySummary(
          db,
          year,
          month,
          userId,
        );
      } catch (err) {
        console.error("Error retrieving expenses for user: ", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      query: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
      }),
    },
  )

  .get(
    "/export",
    async ({ db, query, userId, set }) => {
      const { year, month, format } = query as {
        year: number;
        month: number;
        format: string;
      };

      try {
        const result = await expenseController.exportData(
          db,
          year,
          month,
          format,
          userId,
        );
        if (!result) {
          throw new Error("No data returned");
        }

        set.headers["Content-Type"] = result.contentType;
        set.headers["Content-Disposition"] =
          `attachment; filename="expenses.${result.extension}"`;

        return result.data;
      } catch (err) {
        console.error("Error exporting expense data for user: ", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      query: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
        format: t.String(),
      }),
    },
  )

  /**
   * Single expense routes
   */

  .get(
    "/:expenseId",
    async ({ db, params, userId }) => {
      const { expenseId } = params as { expenseId: string };
      try {
        return await expenseController.getSingleExpense(db, expenseId, userId);
      } catch (err) {
        console.error("Error retrieving expense for user: ", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      params: t.Object({
        expenseId: t.String({ format: "uuid" }),
      }),
    },
  )

  .patch(
    "/:expenseId",
    async ({ db, params, body, userId }) => {
      const { expenseId } = params as { expenseId: string };
      const { categoryId, amount, description, date } = body as {
        categoryId: string;
        amount: number;
        description: string;
        date: string;
      };

      try {
        return await expenseController.updateExpense(db, expenseId, userId, {
          categoryId,
          amount,
          description,
          date,
        });
      } catch (err) {
        console.error("Error updating expense for user:", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      params: t.Object({
        expenseId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        categoryId: t.String({ format: "uuid" }),
        amount: t.Number(),
        description: t.String(),
        date: t.String(),
      }),
    },
  )

  .delete(
    "/:expenseId",
    async ({ db, params, userId, set }) => {
      const { expenseId } = params as { expenseId: string };
      try {
        set.status = 204;
        return !!(await expenseController.deleteExpense(db, expenseId, userId));
      } catch (err) {
        console.error("Error deleting expense for user:", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      params: t.Object({
        expenseId: t.String({ format: "uuid" }),
      }),
    },
  );

