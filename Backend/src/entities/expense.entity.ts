export interface ExpenseProperties {
  expenseId: string;
  userId: string;
  categoryId: string;
  amount: number;
  description: string;
  date: Date;
}

export class ExpenseEntity {
  private expenseId: string;
  private userId: string;
  private categoryId: string;
  private amount: number;
  private description: string;
  private date: Date;

  constructor(properties: ExpenseProperties) {
    this.expenseId = properties.expenseId;
    this.userId = properties.userId;
    this.categoryId = properties.categoryId;
    this.amount = properties.amount;
    this.description = properties.description;
    this.date = properties.date;
  }

  public get id(): string {
    return this.expenseId;
  }

  public get userIdValue(): string {
    return this.userId;
  }

  public get categoryIdValue(): string {
    return this.categoryId;
  }

  public get rawAmount(): number {
    return this.amount;
  }

  public get currentDescription(): string {
    return this.description;
  }

  public get currentDate(): string {
    const y = this.date.getUTCFullYear();
    const m = String(this.date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(this.date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  public getFormattedAmount(): string {
    const dollars: number = this.amount;
    return dollars.toFixed(2);
  }

  public toObject() {
    return {
      id: this.expenseId,
      userId: this.userId,
      categoryId: this.categoryId,
      amount: this.getFormattedAmount(),
      description: this.description,
      date: this.currentDate,
    };
  }
}
