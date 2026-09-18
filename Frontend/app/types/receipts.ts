import type { ExpenseType, RecurrencePattern } from "~/types/expenses";

export interface ParsedReceiptLine {
  description: string;
  amount: number;
  date: string | null;
  type: ExpenseType;
  recurrence: RecurrencePattern;
  suggestedCategoryName: string | null;
}

export interface ParsedReceiptResult {
  merchant: string | null;
  detectedDate: string | null;
  currency: string;
  total: number | null;
  lines: ParsedReceiptLine[];
}
