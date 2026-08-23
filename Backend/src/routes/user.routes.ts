import { Elysia, t } from "elysia";
import { databasePlugin } from '../plugins/database'
import { userController } from "../controllers/user.controller";
import { jwtMiddleware, authDerive, authResolve } from "../middleware/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(databasePlugin)
  .use(jwtMiddleware)
  .post(
    "/login",
    async ({ db, body, jwt }) => {
      const user = await userController.login(db, {
        userEmail: body.email,
        userPassword: body.password,
      });

      const token = await jwt.sign({ sub: user.id });

      return { token, user };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({
          minLength: 8,
          pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$`,
        }),
      }),
    },
  )

  .post("/logout", async ({ set }) => {
    set.status = 200;
    return { success: true, message: "Logged out successfully" };
  })

  .post(
    "/register",
    async ({ db, body, jwt }) => {
      const newUser = await userController.registerUser(
        db,
        body.email,
        body.password,
      );

      const token = await jwt.sign({ sub: newUser.id });

      return { token, user: newUser };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({
          minLength: 8,
          pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$`,
        }),
      }),
    },
  )

  .derive(authDerive)

  .resolve(authResolve)

  /**
   * Single user routes
   */
  .get("/me", async ({ db, userId }) => {
    return userController.getProfile(db, userId);
  })

  .patch(
    "/me",
    async ({ db, userId, body }) => {
      return userController.updateProfile(
        db,
        userId,
        body.currentPassword,
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
    "/me",
    async ({ db, userId, body, set }) => {
      await userController.deleteProfile(db, userId, body.userEmail);

      set.status = 204;
      return { success: true };
    },
    {
      body: t.Object({
        userEmail: t.String({ format: "email" }),
      }),
    },
  );
