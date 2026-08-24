import { Elysia, t } from "elysia";
import { databasePlugin } from "../plugins/database";
import { expenseController } from "../controllers/expense.controller";
import { HttpError } from "../utils";
import { jwtMiddleware, authDerive, authResolve } from "../middleware/auth";

export const expenseRoutes = new Elysia({ prefix: "/expenses" })
  .use(databasePlugin)
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

      const newExpense = await expenseController.createExpense(db, userId, {
        categoryId,
        amount,
        description,
        date,
      });
      if (!newExpense) {
        throw new HttpError(500, "Error creating expense");
      }
      set.status = 201;
      return newExpense;
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
    return expenseController.getExpensesPerUser(db, userId);
  })

  .get(
    "/monthly-sheet",
    async ({ db, query, userId }) => {
      const { year, month } = query as { year: number; month: number };
      return expenseController.findSheetByMonth(db, year, month, userId);
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
      return expenseController.getMonthlySummary(db, year, month, userId);
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

      const result = await expenseController.exportData(
        db,
        year,
        month,
        format,
        userId,
      );
      if (!result) {
        throw new HttpError(404, "No data returned");
      }

      set.headers["Content-Type"] = result.contentType;
      set.headers["Content-Disposition"] =
        `attachment; filename="expenses.${result.extension}"`;

      return result.data;
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
      return expenseController.getSingleExpense(db, expenseId, userId);
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

      return expenseController.updateExpense(db, expenseId, userId, {
        categoryId,
        amount,
        description,
        date,
      });
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
      await expenseController.deleteExpense(db, expenseId, userId);

      set.status = 204;
      return;
    },
    {
      params: t.Object({
        expenseId: t.String({ format: "uuid" }),
      }),
    },
  );
