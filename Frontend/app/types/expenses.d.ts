export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;
  description: string;
  date: string;
}

export interface ExpensePayload {
  categoryId: string;
  amount: number;
  description: string;
  date: string;
}

export interface CategorySpend {
  amountSpent: number;
  categoryId: string;
}
export interface MonthlySummary {
  categories: CategorySpend[];
  month: number;
  totalSpent: number;
  year: number;
}
