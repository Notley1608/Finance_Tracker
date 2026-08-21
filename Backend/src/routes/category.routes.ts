import { Elysia, t } from "elysia";
import { db } from "../db";
import { categoryController } from "../controllers/category.controller";
import { HttpError } from "../utils/utils";
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
      try {
        const newCategory = await categoryController.createCategory(
          db,
          userId,
          categoryName,
        );

        set.status = 201;
        return newCategory;
      } catch (err: any) {
        if (err.message === "CATEGORY_ALREADY_TAKEN") {
          throw new HttpError(409, "Category name already taken");
        }
        console.error("Category creation error: ", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      body: t.Object({
        categoryName: t.String(),
      }),
    },
  )
  .get("/", async ({ db, userId }) => {
    try {
      const allCategoriesForUser =
        await categoryController.getCategoriesForUser(db, userId);
      return allCategoriesForUser;
    } catch (err) {
      console.error("Error retrieving categories for user: ", err);
      throw new HttpError(500, "Internal server error");
    }
  })

  /**
   * Single category routes
   */

  .get(
    "/:categoryId",
    async ({ db, params, userId }) => {
      const { categoryId } = params as { categoryId: string };
      try {
        return await categoryController.getSingleCategory(
          db,
          categoryId,
          userId,
        );
      } catch (err) {
        console.error("Error retrieving category for user: ", err);
        throw new HttpError(500, "Internal server error");
      }
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

      try {
        return await categoryController.updateCategory(
          db,
          categoryName,
          categoryId,
          userId,
        );
      } catch (err) {
        console.error("Error updating category for user:", err);
        throw new HttpError(500, "Internal server error");
      }
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
      try {
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
      } catch (err) {
        console.error("Error deleting category for user:", err);
        throw new HttpError(500, "Internal server error");
      }
    },
    {
      params: t.Object({
        categoryId: t.String({ format: "uuid" }),
      }),
    },
  );
