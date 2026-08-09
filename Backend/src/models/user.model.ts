import { db } from "../db";
import { UserEntity } from "../entities/user.entity";
import { userSchema, type UserSchema } from "../schemas/schema";
import { and, eq } from "drizzle-orm";

export class UserModel {
  private database;
  constructor(databaseConnection: typeof db) {
    this.database = databaseConnection;
  }

  /** methods
   * findByUsername
   * create
   * update
   * delete
   * findById
   */
  /** relationships
   * user --> expense (one to many)
   * user --> category (one to many)
   */

  public static fromDatabase(dbRecord: UserSchema): UserEntity {
    return new UserEntity({
      userId: dbRecord.id,
      userEmail: dbRecord.email,
      userName: dbRecord.name,
      passwordHash: dbRecord.passwordHash,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    });
  }
  public async findByEmail(userEmail: string): Promise<UserEntity | null> {
    const [record] = await this.database
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, userEmail))
      .limit(1);
    return record ? UserModel.fromDatabase(record) : null;
  }

  public async findById(userId: string): Promise<UserEntity | null> {
    const [record] = await this.database
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);
    return record ? UserModel.fromDatabase(record) : null;
  }

  public async create(
    userEmail: string,
    userPassword: string,
  ): Promise<UserEntity | null> {
    try {
      const [newUser] = await this.database
        .insert(userSchema)
        .values({
          id: crypto.randomUUID(),
          email: userEmail,
          name: userEmail.split("@")[0] as string,
          passwordHash: await Bun.password.hash(userPassword),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      if (!newUser) return null;

      return new UserEntity({
        userId: newUser.id,
        userEmail: newUser.email,
        userName: newUser.name,
        passwordHash: newUser.passwordHash,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      });
    } catch (error) {
      console.error("DB insertion failed: ", error);
      return null;
    }
  }

  public async update(
    userId: string,
    userEmail?: string,
    userName?: string,
    userPassword?: string,
  ): Promise<UserEntity | null> {
    const [existingUser] = await this.database
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, userId));

    if (!existingUser) {
      console.error("Could not find user");
      return null;
    }
    const updateFields: Partial<UserSchema> = {};

    if (userEmail !== undefined) {
      updateFields.email = userEmail;
    }

    if (userName !== undefined) {
      updateFields.name = userName;
    }

    if (userPassword !== undefined) {
      updateFields.passwordHash = await Bun.password.hash(userPassword);
    }

    if (Object.keys(updateFields).length === 0) {
      return UserModel.fromDatabase(existingUser);
    }

    updateFields.updatedAt = new Date().toISOString();

    try {
      const [updatedRecord] = await this.database
        .update(userSchema)
        .set(updateFields)
        .where(eq(userSchema.id, userId))
        .returning();

      if (!updatedRecord) return null;

      return UserModel.fromDatabase(updatedRecord);
    } catch (error) {
      console.error("Error updating user: ", error);
      return null;
    }
  }

  public async delete(
    userId: string,
    userEmail: string,
  ): Promise<boolean | null> {
    try {
      const existingUser = await this.database
        .select()
        .from(userSchema)
        .where(and(eq(userSchema.id, userId), eq(userSchema.email, userEmail)));
      if (!existingUser) {
        console.error("Could not find user");
        return null;
      }

      const deletedUser = await this.database
        .delete(userSchema)
        .where(and(eq(userSchema.id, userId)))
        .returning();

      return !!deletedUser;
    } catch (err) {
      console.error("Error deleting user: ", err);
      return null;
    }
  }
}
