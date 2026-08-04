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
      passwordHash: dbRecord.passwordHash,
      createdAt: dbRecord.createdAt,
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
          passwordHash: await Bun.password.hash(userPassword),
          createdAt: new Date().toISOString(),
        })
        .returning();

      if (!newUser) return null;

      return new UserEntity({
        userId: newUser.id,
        userEmail: newUser.email,
        passwordHash: newUser.passwordHash,
        createdAt: newUser.createdAt,
      });
    } catch (error) {
      console.error("DB insertion failed: ", error);
      return null;
    }
  }

  public async update(
    userId: string,
    userEmail?: string,
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

    if (userPassword !== undefined) {
      updateFields.passwordHash = await Bun.password.hash(userPassword);
    }

    if (Object.keys(updateFields).length === 0) {
      return UserModel.fromDatabase(existingUser);
    }

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
    userPassword: string,
  ): Promise<boolean | null> {
    try {
      const existingUser = await this.database
        .select()
        .from(userSchema)
        .where(
          and(
            eq(userSchema.id, userId),
            eq(userSchema.email, userEmail),
            eq(userSchema.passwordHash, userPassword),
          ),
        );
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
