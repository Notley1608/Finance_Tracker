export type ExpenseType = "expense" | "income";

export type RecurrencePattern = "none" | "weekly" | "monthly" | "yearly";

export interface Expense {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  description: string;
  date: string;
  type: ExpenseType;
  recurrence: RecurrencePattern;
}

export interface ExpensePayload {
  categoryId?: string | null;
  amount: number;
  description: string;
  date: string;
  type?: ExpenseType;
  recurrence?: RecurrencePattern;
}

export interface PagedExpenses {
  items: Expense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ExpenseSortKey = "date" | "amount" | "description";

export interface ExpenseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: ExpenseType;
  sortBy?: ExpenseSortKey;
  sortOrder?: "asc" | "desc";
}

export interface CategorySpend {
  amountSpent: number;
  categoryId: string | null;
  categoryName: string | null;
}

export interface MonthlySummary {
  categories: CategorySpend[];
  month: number;
  totalSpent: number;
  totalIncome: number;
  netTotal: number;
  year: number;
}