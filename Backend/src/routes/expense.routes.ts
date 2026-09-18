import { Elysia, t } from "elysia";
import { databasePlugin } from "../plugins/database";
import { expenseController } from "../controllers/expense.controller";
import { HttpError } from "../utils";
import { jwtAccess, authDerive, authResolve } from "../middleware/auth";

const recurrenceEnum = t.Union([
  t.Literal("none"),
  t.Literal("weekly"),
  t.Literal("monthly"),
  t.Literal("yearly"),
]);
const typeEnum = t.Union([t.Literal("expense"), t.Literal("income")]);

export const expenseRoutes = new Elysia({ prefix: "/expenses" })
  .use(databasePlugin)
  .use(jwtAccess)
  .derive(authDerive)
  .resolve(authResolve)
  .post(
    "/",
    async ({ db, body, userId, set }) => {
      const { categoryId, amount, description, date, type, recurrence } = body;

      const newExpense = await expenseController.createExpense(db, userId, {
        categoryId,
        amount,
        description,
        date,
        type,
        recurrence,
      });
      if (!newExpense) {
        throw new HttpError(500, "Error creating expense");
      }
      set.status = 201;
      return newExpense;
    },
    {
      body: t.Object({
        categoryId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
        amount: t.Number({ min: 0.01 }),
        description: t.String(),
        date: t.String({ format: "date" }),
        type: t.Optional(typeEnum),
        recurrence: t.Optional(recurrenceEnum),
      }),
    },
  )

  .get("/", async ({ db, query, userId }) => {
    const {
      page = 1,
      pageSize = 20,
      search,
      categoryId,
      dateFrom,
      dateTo,
      type,
      sortBy = "date",
      sortOrder = "desc",
    } = query;

    return expenseController.getExpensesPerUser(db, userId, {
      page,
      pageSize,
      search,
      categoryId,
      dateFrom,
      dateTo,
      type,
      sortBy,
      sortOrder,
    });
  }, {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      search: t.Optional(t.String()),
      categoryId: t.Optional(t.String({ format: "uuid" })),
      dateFrom: t.Optional(t.String({ format: "date" })),
      dateTo: t.Optional(t.String({ format: "date" })),
      type: t.Optional(typeEnum),
      sortBy: t.Optional(
        t.Union([
          t.Literal("date"),
          t.Literal("amount"),
          t.Literal("description"),
        ]),
      ),
      sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    }),
  })

  .get(
    "/monthly-sheet",
    async ({ db, query, userId }) => {
      const { year, month, includeRecurring } = query;
      return expenseController.findSheetByMonth(
        db,
        year,
        month,
        userId,
        includeRecurring,
      );
    },
    {
      query: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
        includeRecurring: t.Optional(t.Boolean({ default: false })),
      }),
    },
  )

  .get(
    "/monthly-summary",
    async ({ db, query, userId }) => {
      const { year, month, includeRecurring } = query;
      return expenseController.getMonthlySummary(
        db,
        year,
        month,
        userId,
        includeRecurring,
      );
    },
    {
      query: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
        includeRecurring: t.Optional(t.Boolean({ default: false })),
      }),
    },
  )

  .get(
    "/export",
    async ({ db, query, userId, set }) => {
      const { year, month, format, includeRecurring } = query;

      const result = await expenseController.exportData(
        db,
        year,
        month,
        format,
        userId,
        includeRecurring,
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
        includeRecurring: t.Optional(t.Boolean({ default: false })),
      }),
    },
  )

  /**
   * Single expense routes
   */

  .get(
    "/:expenseId",
    async ({ db, params, userId }) => {
      const { expenseId } = params;
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
      const { expenseId } = params;
      const { categoryId, amount, description, date, type, recurrence } = body;

      return expenseController.updateExpense(db, expenseId, userId, {
        categoryId,
        amount,
        description,
        date,
        type,
        recurrence,
      });
    },
    {
      params: t.Object({
        expenseId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        categoryId: t.Optional(
          t.Union([t.String({ format: "uuid" }), t.Null()]),
        ),
        amount: t.Number({ minimum: 0.01 }),
        description: t.String(),
        date: t.String({ format: "date" }),
        type: t.Optional(typeEnum),
        recurrence: t.Optional(recurrenceEnum),
      }),
    },
  )

  .delete(
    "/:expenseId",
    async ({ db, params, userId, set }) => {
      const { expenseId } = params;
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