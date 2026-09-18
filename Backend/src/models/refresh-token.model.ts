import { db } from "../db";
import { and, eq, isNull } from "drizzle-orm";
import {
  refreshTokenSchema,
  type RefreshTokenSchema,
} from "../schemas/schema";

export class RefreshTokenModel {
  private database;
  constructor(databaseConnection: typeof db) {
    this.database = databaseConnection;
  }

  public async create(
    userId: string,
    tokenHash: string,
    expiresAt: string,
  ): Promise<RefreshTokenSchema | null> {
    const [record] = await this.database
      .insert(refreshTokenSchema)
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

  public async findActiveByHash(tokenHash: string): Promise<RefreshTokenSchema | null> {
    const [record] = await this.database
      .select()
      .from(refreshTokenSchema)
      .where(
        and(
          eq(refreshTokenSchema.token_hash, tokenHash),
          isNull(refreshTokenSchema.revokedAt),
        ),
      )
      .limit(1);
    return record ?? null;
  }

  public async revoke(id: string): Promise<void> {
    await this.database
      .update(refreshTokenSchema)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(refreshTokenSchema.id, id));
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.database
      .update(refreshTokenSchema)
      .set({ revokedAt: new Date().toISOString() })
      .where(
        and(
          eq(refreshTokenSchema.user_id, userId),
          isNull(refreshTokenSchema.revokedAt),
        ),
      );
  }
}