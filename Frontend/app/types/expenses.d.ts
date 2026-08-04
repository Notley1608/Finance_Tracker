export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
}

export interface ExpensePayload {
    categoryId: string;
    amount: number;
    description: string;
    date: string;
}
