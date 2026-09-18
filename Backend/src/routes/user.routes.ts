import { Elysia, t } from "elysia";
import { databasePlugin } from "../plugins/database";
import { userController } from "../controllers/user.controller";
import {
  jwtAccess,
  signAccessToken,
  authDerive,
  authResolve,
} from "../middleware/auth";
import { HttpError } from "../utils";
import { rateLimit, clearRateLimit, clientIp } from "../utils/rateLimit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const EMAIL_MAX_ATTEMPTS = 5;

const passwordPattern = `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$`;

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(databasePlugin)
  .use(jwtAccess)
  .post(
    "/login",
    async ({ db, body, jwtAccess: jwt, headers }) => {
      const ip = clientIp(headers);
      const failureKey = `login:fail:${body.email}`;

      rateLimit(`login:ip:${ip}`, {
        windowMs: LOGIN_WINDOW_MS,
        max: LOGIN_MAX_ATTEMPTS,
      });
      rateLimit(failureKey, { windowMs: LOGIN_WINDOW_MS, max: EMAIL_MAX_ATTEMPTS });

      const user = await userController.login(db, {
        userEmail: body.email,
        userPassword: body.password,
      });
      clearRateLimit(failureKey);

      const accessToken = await signAccessToken(jwt, user.id);
      const refreshToken = await userController.issueRefreshToken(db, user.id);

      return { accessToken, refreshToken, user };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8, pattern: passwordPattern }),
      }),
    },
  )

  .post(
    "/refresh",
    async ({ db, body, jwtAccess: jwt }) => {
      const session = await userController.rotateRefreshToken(
        db,
        body.refreshToken,
      );
      if (!session) {
        throw new HttpError(401, "Invalid or expired refresh token");
      }

      const accessToken = await signAccessToken(jwt, session.userId);
      const user = await userController.getProfile(db, session.userId);

      return {
        accessToken,
        refreshToken: session.refreshToken,
        user,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String({ minLength: 32 }),
      }),
    },
  )

  .post(
    "/logout",
    async ({ db, body, }) => {
      await userController.revokeRefreshToken(db, body.refreshToken);
      return { success: true, message: "Logged out successfully" };
    },
    {
      body: t.Object({
        refreshToken: t.String({ minLength: 32 }),
      }),
    },
  )

  .post(
    "/register",
    async ({ db, body, jwtAccess: jwt, headers }) => {
      const ip = clientIp(headers);
      rateLimit(`register:ip:${ip}`, {
        windowMs: LOGIN_WINDOW_MS,
        max: 10,
      });

      const newUser = await userController.registerUser(
        db,
        body.email,
        body.password,
      );

      const accessToken = await signAccessToken(jwt, newUser.id);
      const refreshToken = await userController.issueRefreshToken(db, newUser.id);

      return { accessToken, refreshToken, user: newUser };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8, pattern: passwordPattern }),
      }),
    },
  )

  .post(
    "/forgot-password",
    async ({ db, body }) => {
      await userController.requestPasswordReset(db, body.email);
      return { success: true };
    },
    {
      body: t.Object({ email: t.String({ format: "email" }) }),
    },
  )

  .post(
    "/reset-password",
    async ({ db, body }) => {
      await userController.resetPassword(db, body.token, body.newPassword);
      return { success: true };
    },
    {
      body: t.Object({
        token: t.String({ minLength: 20 }),
        newPassword: t.String({ minLength: 8, pattern: passwordPattern }),
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
          t.String({ minLength: 8, pattern: passwordPattern }),
        ),
      }),
    },
  )

  .delete(
    "/me",
    async ({ db, userId, body, set }) => {
      await userController.deleteProfile(db, userId, body.userEmail);

      set.status = 204;
      return;
    },
    {
      body: t.Object({
        userEmail: t.String({ format: "email" }),
      }),
    },
  );