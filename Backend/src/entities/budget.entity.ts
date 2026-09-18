export interface BudgetProperties {
  budgetId: string;
  userId: string;
  categoryId: string;
  limit: number;
  createdAt: string;
  updatedAt: string;
}

export class BudgetEntity {
  private budgetId: string;
  private userId: string;
  private categoryId: string;
  private limit: number;
  private createdAt: string;
  private updatedAt: string;

  constructor(properties: BudgetProperties) {
    this.budgetId = properties.budgetId;
    this.userId = properties.userId;
    this.categoryId = properties.categoryId;
    this.limit = properties.limit;
    this.createdAt = properties.createdAt;
    this.updatedAt = properties.updatedAt;
  }

  public get id(): string {
    return this.budgetId;
  }

  public get userIdValue(): string {
    return this.userId;
  }

  public get categoryIdValue(): string {
    return this.categoryId;
  }

  public get limitValue(): number {
    return this.limit;
  }

  public toObject() {
    return {
      id: this.budgetId,
      categoryId: this.categoryId,
      limit: this.limit,
    };
  }
}