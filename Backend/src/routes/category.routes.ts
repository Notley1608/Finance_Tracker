import { Elysia, t } from "elysia";
import { db } from "../db";
import { categoryController } from "../controllers/category.controller";
import { HttpError } from "../utils";
import { jwtMiddleware, authDerive, authResolve } from "../middleware/auth";

export const categoryRoutes = new Elysia({ prefix: "/categories" })
  .decorate("db", db)
  .use(jwtMiddleware)
  .derive(authDerive)
  .resolve(authResolve)

  .post(
    "/",
    async ({ db, body, userId, set }) => {
      const { categoryName } = body as {
        categoryName: string;
      };

      const newCategory = await categoryController.createCategory(
        db,
        userId,
        categoryName,
      );

      set.status = 201;
      return newCategory;
    },
    {
      body: t.Object({
        categoryName: t.String(),
      }),
    },
  )

  .get("/", async ({ db, userId }) => {
    return categoryController.getCategoriesForUser(db, userId);
  })

  /**
   * Single category routes
   */

  .get(
    "/:categoryId",
    async ({ db, params, userId }) => {
      const { categoryId } = params as { categoryId: string };
      return categoryController.getSingleCategory(db, categoryId, userId);
    },
    {
      params: t.Object({
        categoryId: t.String({ format: "uuid" }),
      }),
    },
  )

  .patch(
    "/:categoryId",
    async ({ db, params, body, userId }) => {
      const { categoryId } = params as { categoryId: string };
      const { categoryName } = body as { categoryName: string };

      return categoryController.updateCategory(
        db,
        categoryName,
        categoryId,
        userId,
      );
    },
    {
      body: t.Object({
        categoryName: t.String(),
      }),
      params: t.Object({
        categoryId: t.String({ format: "uuid" }),
      }),
    },
  )

  .delete(
    "/:categoryId",
    async ({ db, params, userId, set }) => {
      const { categoryId } = params as { categoryId: string };

      const deletedCategory = await categoryController.deleteCategory(
        db,
        categoryId,
        userId,
      );
      if (!deletedCategory) {
        throw new HttpError(404, "Category not found");
      }

      set.status = 204;
      return { success: true };
    },
    {
      params: t.Object({
        categoryId: t.String({ format: "uuid" }),
      }),
    },
  );
