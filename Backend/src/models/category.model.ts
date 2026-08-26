import { db } from "../db";
import { categorySchema, expenseSchema, type CategorySchema } from "../schemas/schema";
import { CategoryEntity } from "../entities/category.entity";
import { and, eq, count } from "drizzle-orm";

export class CategoryModel {
  /** methods
   * create
   * findAllByUserId
   * findByName
   * delete
   */
  /**relationships
   * category --> expense (one to many)
   */

  private database;
  constructor(databaseConnection: typeof db) {
    this.database = databaseConnection;
  }

  public static fromDatabase(dbRecord: CategorySchema): CategoryEntity {
    return new CategoryEntity({
      id: dbRecord.id,
      name: dbRecord.name,
      userId: dbRecord.user_id,
      expenseCount: 0,
    });
  }

  public async findAllByUserId(userId: string): Promise<CategoryEntity[]> {
    const records = await this.database
      .select({
        id: categorySchema.id,
        name: categorySchema.name,
        user_id: categorySchema.user_id,
        expenseCount: count(expenseSchema.id),
      })
      .from(categorySchema)
      .leftJoin(expenseSchema, eq(categorySchema.id, expenseSchema.category_id))
      .where(eq(categorySchema.user_id, userId))
      .groupBy(categorySchema.id);

    if (!records || records.length === 0) return [];

    return records.map((record) => {
      return new CategoryEntity({
        id: record.id,
        userId: record.user_id,
        name: record.name,
        expenseCount: record.expenseCount,
      });
    });
  }

  public async findByName(
    userId: string,
    name: string,
  ): Promise<CategoryEntity | null> {
    const [record] = await this.database
      .select()
      .from(categorySchema)
      .where(
        and(eq(categorySchema.name, name), eq(categorySchema.user_id, userId)),
      )
      .limit(1);
    return record ? CategoryModel.fromDatabase(record) : null;
  }

  public async findById(
    categoryId: string,
    userId: string,
  ): Promise<CategoryEntity | null> {
    const [record] = await this.database
      .select()
      .from(categorySchema)
      .where(
        and(
          eq(categorySchema.id, categoryId),
          eq(categorySchema.user_id, userId),
        ),
      )
      .limit(1);
    return record ? CategoryModel.fromDatabase(record) : null;
  }

  public async create(
    name: string,
    userId: string,
  ): Promise<CategoryEntity | null> {
    const [existingCategory] = await this.database
      .select()
      .from(categorySchema)
      .where(
        and(eq(categorySchema.user_id, userId), eq(categorySchema.name, name)),
      );
    if (existingCategory) {
      return null;
    }
    const [newCategory] = await this.database
      .insert(categorySchema)
      .values({ id: crypto.randomUUID(), user_id: userId, name: name })
      .returning();

    if (!newCategory) return null;

    return new CategoryEntity({
      id: newCategory.id,
      userId: newCategory.user_id,
      name: newCategory.name,
      expenseCount: 0,
    });
  }

  public async update(
    categoryId: string,
    categoryName: string,
    userId: string,
  ): Promise<CategoryEntity | null> {
    const [existingCategory] = await this.database
      .select()
      .from(categorySchema)
      .where(
        and(
          eq(categorySchema.id, categoryId),
          eq(categorySchema.user_id, userId),
          eq(categorySchema.name, categoryName),
        ),
      );
    if (!existingCategory) {
      return null;
    }

    const [updatedRecord] = await this.database
      .update(categorySchema)
      .set({ name: categoryName })
      .where(eq(categorySchema.id, categoryId))
      .returning();
    if (!updatedRecord) return null;

    return CategoryModel.fromDatabase(updatedRecord);
  }

  public async delete(
    categoryId: string,
    userId: string,
  ): Promise<boolean | null> {
    const deletedCategory = await this.database
      .delete(categorySchema)
      .where(
        and(
          eq(categorySchema.id, categoryId),
          eq(categorySchema.user_id, userId),
        ),
      )
      .returning();
    return !!deletedCategory;
  }
}
