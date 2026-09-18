import { Elysia, t } from "elysia";
import { databasePlugin } from "../plugins/database";
import { budgetController } from "../controllers/budget.controller";
import { jwtAccess, authDerive, authResolve } from "../middleware/auth";

export const budgetRoutes = new Elysia({ prefix: "/budgets" })
  .use(databasePlugin)
  .use(jwtAccess)
  .derive(authDerive)
  .resolve(authResolve)

  .get(
    "/",
    async ({ db, query, userId }) => {
      const { year, month } = query;
      return budgetController.listBudgets(db, userId, year, month);
    },
    {
      query: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
      }),
    },
  )

  .post(
    "/",
    async ({ db, body, userId, set }) => {
      const { categoryId, limit } = body;
      const budget = await budgetController.upsertBudget(
        db,
        userId,
        categoryId,
        limit,
      );
      set.status = 201;
      return budget;
    },
    {
      body: t.Object({
        categoryId: t.String({ format: "uuid" }),
        limit: t.Number({ minimum: 1 }),
      }),
    },
  )

  .delete(
    "/:categoryId",
    async ({ db, params, userId, set }) => {
      const { categoryId } = params;
      await budgetController.deleteBudget(db, userId, categoryId);

      set.status = 204;
      return;
    },
    {
      params: t.Object({
        categoryId: t.String({ format: "uuid" }),
      }),
    },
  );