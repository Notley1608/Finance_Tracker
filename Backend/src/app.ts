import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { HttpError } from "./utils";
import { userRoutes } from "./routes/user.routes";
import { categoryRoutes } from "./routes/category.routes";
import { expenseRoutes } from "./routes/expense.routes";
import { budgetRoutes } from "./routes/budget.routes";

const app = new Elysia()
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.statusCode;
      return { error: error.message };
    } else {
      console.error(error);
    }
    set.status = 500;
    return {
      message: (error as Error).message || "Internal server error",
    };
  })
  .use(cors())
  .use(swagger())

  .use(userRoutes)
  .use(categoryRoutes)
  .use(expenseRoutes)
  .use(budgetRoutes)

  .get("/", () => ({
    success: true,
    message: "Valid connection established",
  }));

export default app;
