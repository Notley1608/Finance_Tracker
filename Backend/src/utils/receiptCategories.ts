import { eq } from "drizzle-orm";
import { db } from "../db";
import { categorySchema } from "../schemas/schema";

export async function getCategoriesByUser(
  databaseConnection: typeof db,
  userId: string,
): Promise<string[]> {
  if (!databaseConnection || !userId) return [];
  const rows = await databaseConnection
    .select({ name: categorySchema.name })
    .from(categorySchema)
    .where(eq(categorySchema.user_id, userId));
  return rows
    .map((row) => row.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}
