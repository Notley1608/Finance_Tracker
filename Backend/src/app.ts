import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { HttpError } from "./utils";
import { userRoutes } from "./routes/user.routes";
import { categoryRoutes } from "./routes/category.routes";
import { expenseRoutes } from "./routes/expense.routes";

const app = new Elysia()
  .use(cors())
  .use(swagger())

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
      return { error: error.message };
    } else {
      console.error(error);
    }
    set.status = 500;
    return {
      message: (error as Error).message || "Internal server error",
    };
  });

export default app;
