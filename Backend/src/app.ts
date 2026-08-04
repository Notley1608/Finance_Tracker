import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { db } from "./db";
import { HttpError } from "./utils/utils";
import { userRoutes } from "./routes/user.routes";
import { categoryRoutes } from "./routes/category.routes";
import { expenseRoutes } from "./routes/expense.routes";

const app = new Elysia()
  .use(cors())
  .decorate("db", db)

  .use(userRoutes)
  .use(categoryRoutes)
  .use(expenseRoutes)

  .get("/", () => ({
    success: true,
    message: "Valid connection established",
  }))

  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.statusCode;
      console.error(error.message);
      return { error: error.message };
    }
    set.status = 500;
    return {
      success: false,
      message: (error as Error).message || "Internal server error",
    };
  });

export default app;
