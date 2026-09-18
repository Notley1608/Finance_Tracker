import { createApiClient } from "../client";
import type { ParsedReceiptResult } from "~/types/receipts";

export interface ReceiptUploadRequestOptions {
  onProgress?: (percent: number) => void;
}

export function useReceiptsApi() {
  const apiClient = createApiClient();

  return {
    async uploadReceipt(
      file: File,
      options: ReceiptUploadRequestOptions = {},
    ): Promise<ParsedReceiptResult> {
      const form = new FormData();
      form.append("file", file, file.name);

      return apiClient<ParsedReceiptResult>("/imports/receipt", {
        method: "POST",
        body: form,
        onResponse: ({ response }) => {
          const bytes = (response as { size?: number })?.size ?? 0;
          if (bytes > 0) {
            options.onProgress?.(100);
          }
        },
      });
    },
  };
}

export function linesForReview(
  result: ParsedReceiptResult,
): Array<{
  description: string;
  amount: number;
  categoryId: string;
  date: string;
}> {
  return (result.lines ?? []).map((line) => ({
    description: line.description,
    amount: line.amount,
    categoryId: "",
    date: "",
  }));
}
