import { db } from "../db";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  passwordResetSchema,
  type PasswordResetSchema,
} from "../schemas/schema";

export class PasswordResetModel {
  private database;
  constructor(databaseConnection: typeof db) {
    this.database = databaseConnection;
  }

  public async create(
    userId: string,
    tokenHash: string,
    expiresAt: string,
  ): Promise<PasswordResetSchema | null> {
    const [record] = await this.database
      .insert(passwordResetSchema)
      .values({
        id: crypto.randomUUID(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        createdAt: new Date().toISOString(),
      })
      .returning();
    return record ?? null;
  }

  public async findActiveByHash(tokenHash: string): Promise<PasswordResetSchema | null> {
    const now = new Date().toISOString();
    const [record] = await this.database
      .select()
      .from(passwordResetSchema)
      .where(
        and(
          eq(passwordResetSchema.token_hash, tokenHash),
          isNull(passwordResetSchema.used_at),
          gt(passwordResetSchema.expires_at, now),
        ),
      )
      .limit(1);
    return record ?? null;
  }

  public async findByHash(tokenHash: string): Promise<PasswordResetSchema | null> {
    const [record] = await this.database
      .select()
      .from(passwordResetSchema)
      .where(eq(passwordResetSchema.token_hash, tokenHash))
      .limit(1);
    return record ?? null;
  }

  public async markUsed(id: string): Promise<void> {
    await this.database
      .update(passwordResetSchema)
      .set({ used_at: new Date().toISOString() })
      .where(eq(passwordResetSchema.id, id));
  }
}