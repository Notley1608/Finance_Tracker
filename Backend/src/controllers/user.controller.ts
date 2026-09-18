import { db } from "../db";
import { UserModel } from "../models/user.model";
import { RefreshTokenModel } from "../models/refresh-token.model";
import { PasswordResetModel } from "../models/password-reset.model";
import { HttpError } from "../utils";
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from "../utils/tokens";
import { sendPasswordResetEmail } from "../mailer";

export const userController = {
  async login(
    databaseConnection: typeof db,
    body: { userEmail: string; userPassword: string },
  ) {
    const userModel = new UserModel(databaseConnection);

    const existingUser = await userModel.findByEmail(body.userEmail);
    if (!existingUser) {
      throw new HttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await existingUser.verifyPassword(
      body.userPassword,
    );
    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      createdAt: existingUser.created,
      updatedAt: existingUser.updated,
    };
  },

  async getProfile(databaseConnection: typeof db, userId: string) {
    const userModel = new UserModel(databaseConnection);
    const user = await userModel.findById(userId);

    if (!user) throw new HttpError(404, "User not found");
    return user.toObject();
  },

  async registerUser(
    databaseConnection: typeof db,
    userEmail: string,
    userPassword: string,
  ) {
    const userModel = new UserModel(databaseConnection);
    const existingUser = await userModel.findByEmail(userEmail);
    if (existingUser) {
      throw new HttpError(409, "Email already taken");
    }

    const newUser = await userModel.create(userEmail, userPassword);
    if (!newUser) {
      throw new HttpError(500, "Error creating user");
    }

    return newUser.toObject();
  },

  async updateProfile(
    databaseConnection: typeof db,
    userId: string,
    userPassword: string | undefined,
    body: {
      updatedName: string | undefined;
      updatedEmail: string | undefined;
      updatedPassword: string | undefined;
    },
  ) {
    const userModel = new UserModel(databaseConnection);
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      throw new HttpError(404, "User not found");
    }

    if (body.updatedPassword) {
      if (!userPassword) {
        throw new HttpError(400, "Current password is required");
      }

      const verifyPassword = await existingUser.verifyPassword(userPassword);

      if (!verifyPassword) {
        throw new HttpError(401, "Invalid password");
      }
    }

    const updatedUser = await userModel.update(
      userId,
      body.updatedEmail,
      body.updatedName,
      body.updatedPassword,
    );
    if (!updatedUser) {
      throw new HttpError(500, "Error updating user");
    }
    return updatedUser.toObject();
  },

  async deleteProfile(
    databaseConnection: typeof db,
    userId: string,
    userEmail: string,
  ) {
    const userModel = new UserModel(databaseConnection);
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      throw new HttpError(404, "User not found");
    }

    const deletedUser = await userModel.delete(userId, userEmail);
    if (!deletedUser) {
      throw new HttpError(500, "Error deleting user");
    }
    return !!deletedUser;
  },

  async issueRefreshToken(
    databaseConnection: typeof db,
    userId: string,
  ): Promise<string> {
    const refreshTokenModel = new RefreshTokenModel(databaseConnection);
    const token = generateRefreshToken();
    const created = await refreshTokenModel.create(
      userId,
      hashToken(token),
      refreshTokenExpiry(),
    );
    if (!created) {
      throw new HttpError(500, "Error issuing session");
    }
    return token;
  },

  async rotateRefreshToken(
    databaseConnection: typeof db,
    refreshToken: string,
  ): Promise<{ userId: string; refreshToken: string } | null> {
    const refreshTokenModel = new RefreshTokenModel(databaseConnection);
    const record = await refreshTokenModel.findActiveByHash(
      hashToken(refreshToken),
    );
    if (!record) {
      return null;
    }
    if (new Date(record.expires_at).getTime() <= Date.now()) {
      await refreshTokenModel.revoke(record.id);
      return null;
    }

    const newToken = generateRefreshToken();
    await refreshTokenModel.create(
      record.user_id,
      hashToken(newToken),
      refreshTokenExpiry(),
    );
    await refreshTokenModel.revoke(record.id);

    return { userId: record.user_id, refreshToken: newToken };
  },

  async revokeRefreshToken(
    databaseConnection: typeof db,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenModel = new RefreshTokenModel(databaseConnection);
    const record = await refreshTokenModel.findActiveByHash(
      hashToken(refreshToken),
    );
    if (record) {
      await refreshTokenModel.revoke(record.id);
    }
  },

  async requestPasswordReset(
    databaseConnection: typeof db,
    userEmail: string,
  ): Promise<void> {
    const userModel = new UserModel(databaseConnection);
    const passwordResetModel = new PasswordResetModel(databaseConnection);
    const user = await userModel.findByEmail(userEmail);
    if (!user) {
      return;
    }

    const token = generateRefreshToken();
    await passwordResetModel.create(
      user.id,
      hashToken(token),
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    );
    sendPasswordResetEmail(user.email, token);
  },

  async resetPassword(
    databaseConnection: typeof db,
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    const userModel = new UserModel(databaseConnection);
    const passwordResetModel = new PasswordResetModel(databaseConnection);

    const record = await passwordResetModel.findActiveByHash(
      hashToken(resetToken),
    );
    if (!record) {
      throw new HttpError(400, "Invalid or expired reset token");
    }

    const updatedUser = await userModel.updatePassword(
      record.user_id,
      newPassword,
    );
    if (!updatedUser) {
      throw new HttpError(500, "Error updating password");
    }

    await passwordResetModel.markUsed(record.id);
    await new RefreshTokenModel(databaseConnection).revokeAllForUser(
      record.user_id,
    );
  },
};
