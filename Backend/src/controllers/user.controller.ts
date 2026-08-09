import { db } from "../db";
import { UserModel } from "../models/user.model";

export const userController = {
  async login(
    databaseConnection: typeof db,
    body: { userEmail: string; userPassword: string },
  ) {
    const userModel = new UserModel(databaseConnection);

    const existingUser = await userModel.findByEmail(body.userEmail);
    if (!existingUser) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await existingUser.verifyPassword(
      body.userPassword,
    );
    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
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

    if (!user) throw new Error("User not found");
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
      throw new Error("Email already taken");
    }

    try {
      const newUser = await userModel.create(userEmail, userPassword);
      if (!newUser) throw new Error("Error creating user");

      return newUser.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown registration error";
      throw new Error(message);
    }
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
      throw new Error("User not found");
    }

    if (body.updatedPassword) {
      if (!userPassword) {
        throw new Error("Current password is required");
      }

      const verifyPassword = await existingUser.verifyPassword(userPassword);

      if (!verifyPassword) {
        throw new Error("Invalid password");
      }
    }

    try {
      const updatedUser = await userModel.update(
        userId,
        body.updatedEmail,
        body.updatedName,
        body.updatedPassword,
      );
      if (!updatedUser) {
        throw new Error("Error updating user");
      }
      return updatedUser.toObject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown update user error";
      throw new Error(message);
    }
  },

  async deleteProfile(
    databaseConnection: typeof db,
    userId: string,
    userEmail: string,
  ) {
    const userModel = new UserModel(databaseConnection);
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    try {
      const deletedUser = await userModel.delete(
        userId,
        userEmail,
      );
      if (!deletedUser) {
        throw new Error("Error deleting user");
      }
      return !!deletedUser;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown deletion error";
      throw new Error(message);
    }
  },
};
