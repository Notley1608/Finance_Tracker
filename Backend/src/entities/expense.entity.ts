export type ExpenseType = "expense" | "income";
export type RecurrencePattern = "none" | "weekly" | "monthly" | "yearly";

export interface ExpenseProperties {
  expenseId: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  description: string;
  date: Date;
  type: ExpenseType;
  recurrence: RecurrencePattern;
}

export class ExpenseEntity {
  private expenseId: string;
  private userId: string;
  private categoryId: string | null;
  private amount: number;
  private description: string;
  private date: Date;
  private type: ExpenseType;
  private recurrence: RecurrencePattern;

  constructor(properties: ExpenseProperties) {
    this.expenseId = properties.expenseId;
    this.userId = properties.userId;
    this.categoryId = properties.categoryId;
    this.amount = properties.amount;
    this.description = properties.description;
    this.date = properties.date;
    this.type = properties.type;
    this.recurrence = properties.recurrence;
  }

  public get id(): string {
    return this.expenseId;
  }

  public get userIdValue(): string {
    return this.userId;
  }

  public get categoryIdValue(): string | null {
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

  public get currentType(): ExpenseType {
    return this.type;
  }

  public get currentRecurrence(): RecurrencePattern {
    return this.recurrence;
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
      type: this.type,
      recurrence: this.recurrence,
    };
  }
}