import { db } from "../db";
import { UserModel } from "../models/user.model";
import { HttpError } from "../utils";

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
};
