export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string | null;
  categoryColour: string | null;
  limit: number;
  month: string;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface BudgetPayload {
  categoryId: string;
  limit: number;
}