import { Elysia, t } from "elysia";
import { db } from "../db";
import { userController } from "../controllers/user.controller";
import { HttpError } from "../utils/utils";
import { jwtMiddleware, authDerive, authResolve } from "../middleware/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .decorate("db", db)
  .use(jwtMiddleware)
  .post(
    "/login",
    async ({ db, body, jwt }) => {
      try {
        const user = await userController.login(db, {
          userEmail: body.email,
          userPassword: body.password,
        });

        const token = await jwt.sign({ sub: user.id });

        return { token, user };
      } catch (err: any) {
        if (err.message === "INVALID_CREDENTIALS") {
          throw new HttpError(401, "Invalid email or password");
        }
        throw new HttpError(500, "Internal Server Error");
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({
          minLength: 8,
          pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$`,
        }),
      }),
      cookie: t.Cookie({
        auth: t.Optional(t.String()),
      }),
    },
  )

  .post("/logout", async ({ cookie, set }) => {
    if (cookie.auth) cookie.auth.remove();
    if (cookie.refreshToken) cookie.refreshToken.remove();

    set.status = 200;
    return { success: true, message: "Logged out successfully" };
  })

  .post(
    "/register",
    async ({ db, body, jwt }) => {
      try {
        const newUser = await userController.registerUser(
          db,
          body.email,
          body.password,
        );

        const token = await jwt.sign({ sub: newUser.id });

        return { token, user: newUser };
      } catch (err: any) {
        if (err.message === "EMAIL_ALREADY_TAKEN") {
          throw new HttpError(409, "Email already taken by existing user");
        }
        if (err.message === "WEAK_PASSWORD") {
          throw new HttpError(400, "Password needs to be stronger");
        }
        console.error("Registration error:", err);
        throw new HttpError(500, "Internal Server Error");
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({
          minLength: 8,
          pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$`,
        }),
      }),
      cookie: t.Cookie({
        auth: t.Optional(t.String()),
      }),
    },
  )

  .derive(authDerive)

  .resolve(authResolve)

  /**
   * Single user routes
   */
  .get("/:userId", async ({ db, userId }) => {
    return userController.getProfile(db, userId);
  })

  .patch(
    "/:userId",
    async ({ db, userId, body }) => {
      return userController.updateProfile(
        db,
        userId,
        body.currentPassword as string,
        {
          updatedEmail: body.newEmail,
          updatedName: body.newName,
          updatedPassword: body.newPassword,
        },
      );
    },
    {
      body: t.Object({
        currentPassword: t.Optional(t.String({ minLength: 8 })),
        newEmail: t.Optional(t.String({ format: "email" })),
        newName: t.Optional(t.String({ minLength: 1 })),
        newPassword: t.Optional(
          t.String({
            minLength: 8,
            pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$`,
          }),
        ),
      }),
    },
  )

  .delete(
    "/:userId",
    async ({ db, userId, body, set }) => {
      const deletedUser = await userController.deleteProfile(
        db,
        userId,
        body.userEmail,
      );
      if (!deletedUser) {
        throw new HttpError(404, "User not found");
      }

      set.status = 204;
      return { success: true };
    },
    {
      body: t.Object({
        userEmail: t.String({ format: "email" }),
      }),
    },
  );

