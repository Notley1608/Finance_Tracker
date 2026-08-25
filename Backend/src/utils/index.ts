export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
}

export const formatDate = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" });
  return formatter.format(date);
};

export const escapeCsvCell = (value: unknown): string => {
  const stringValue = String(value ?? "");

  const safeValue = /^[=+\-@]/.test(stringValue)
    ? `'${stringValue}`
    : stringValue;

  return `"${safeValue.replace(/"/g, '""')}"`;
};
