import type { ExpenseType, RecurrencePattern } from "../entities/expense.entity";

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

export interface ReceiptParserOptions {
  defaultDate?: string | null;
  categoryNames?: string[];
}

const MERCHANT_SKIP = [
  /^[\d\s.,()/-]+$/,
  /^(phone|tel|fax|address|www\.|http|email|table|server|barcode|qr\s?code)/i,
  /^(thank\s?you|have a nice|come again|questions|returns)/i,
];

const TOTAL_ANCHORS = [
  /grand\s*total/i,
  /\btotal\b/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /final\s*total/i,
];

const INCOME_KEYWORDS = [
  /refund/i,
  /return/i,
  /reimburs/i,
  /deposit/i,
  /cash\s*back/i,
  /payment\s*received/i,
];

const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  groceries: [/grocery/i, /supermarket/i, /market/i, /produce/i],
  dining: [/restaurant/i, /cafe/i, /coffee/i, /brunch/i, /diner/i, /takeaway/i, /pizza/i],
  transport: [/gas/i, /fuel/i, /uber/i, /lyft/i, /taxi/i, /parking/i, /metro/i, /transit/i],
  utilities: [/electric/i, /water\s*bill/i, /internet/i, /broadband/i, /phone\s*bill/i],
  subscriptions: [/netflix/i, /spotify/i, /subscription/i, /patreon/i, /icloud/i],
  rent: [/rent/i, /lease/i, /mortgage/i],
  shopping: [/amazon/i, /walmart/i, /target/i, /best\s*buy/i],
};

const CURRENCY_PREFIX = /^(USD|US\$|CAD|EUR|GBP|JPY|R\$|R)\s*/i;
const CURRENCY_SYMBOL = /^\$\s*/;
const NEGATIVE = /^-\s*|^–\s*/;
const DATE_LINE = /^(?<y>\d{4})[/.-](?<m>\d{1,2})[/.-](?<d>\d{1,2})$/;
const DATE_TOKEN_MM_DD_YYYY = /^(?<m>\d{1,2})[/.-](?<d>\d{1,2})[/.-](?<y>\d{2}(?:\d{2})?)$/;
const AMOUNT_ON_LINE = /(?<amount>-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*$/;
const MERCHANT_MAX = 60;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoFromParts(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return iso;
}

function parseNumberToken(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const negative = NEGATIVE.test(trimmed);
  const body = trimmed.replace(CURRENCY_PREFIX, "").replace(CURRENCY_SYMBOL, "").replace(NEGATIVE, "");
  const hasDot = body.includes(".");
  const hasComma = body.includes(",");

  if (hasDot && hasComma) {
    const lastDot = body.lastIndexOf(".");
    const lastComma = body.lastIndexOf(",");
    const normalized = lastDot > lastComma ? body.replace(/,/g, "") : body.replace(/\./g, "").replace(",", ".");
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount > 0 ? amount * (negative ? -1 : 1) : null;
  }

  if (hasComma) {
    const [left, right] = body.split(",");
    const rightIsDecimals = right !== undefined && /^\d{1,2}$/.test(right);
    const normalized = rightIsDecimals ? `${left}.${right}` : body.replace(/,/g, "");
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount > 0 ? amount * (negative ? -1 : 1) : null;
  }

  const amount = Number(body);
  return Number.isFinite(amount) && amount > 0 ? amount * (negative ? -1 : 1) : null;
}

function parseDateToken(token: string): string | null {
  const dateLine = token.match(DATE_LINE);
  if (dateLine?.groups) {
    return isoFromParts(Number(dateLine.groups.y), Number(dateLine.groups.m), Number(dateLine.groups.d));
  }
  const us = token.match(DATE_TOKEN_MM_DD_YYYY);
  if (us?.groups) {
    const year = Number(us.groups.y);
    const year2 = year < 100 ? year + 2000 : year;
    return isoFromParts(year2, Number(us.groups.m), Number(us.groups.d));
  }
  return null;
}

function findMerchant(lines: string[]): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > MERCHANT_MAX) continue;
    if (MERCHANT_SKIP.some((re) => re.test(trimmed))) continue;
    if (parseNumberToken(trimmed) !== null) continue;
    if (parseDateToken(trimmed) !== null) continue;
    return trimmed.replace(/\s{2,}/g, " ").slice(0, MERCHANT_MAX);
  }
  return null;
}

function findDate(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(DATE_LINE);
    if (match?.groups) {
      const iso = isoFromParts(Number(match.groups.y), Number(match.groups.m), Number(match.groups.d));
      if (iso) return iso;
    }
    for (const token of line.trim().split(/\s+/)) {
      const parsed = parseDateToken(token);
      if (parsed) return parsed;
    }
  }
  return null;
}

function findTotal(lines: string[]): number | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!TOTAL_ANCHORS.some((re) => re.test(line))) continue;
    const onLine = parseNumberToken(line.replace(/[^\d.,$-]/g, "").replace(/[a-zA-Z\s:]/g, ""));
    if (onLine !== null) return Math.abs(onLine);
    const next = lines[index + 1] ?? "";
    const nextAmount = parseNumberToken(next.replace(/[^\d.,$-]/g, "").replace(/[a-zA-Z\s:]/g, ""));
    if (nextAmount !== null) return Math.abs(nextAmount);
  }
  return null;
}

function suggestCategory(description: string, categoryNames: string[]): string | null {
  for (const [categoryName, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!patterns.some((re) => re.test(description))) continue;
    const byName = categoryNames.find((name) => name.toLowerCase() === categoryName);
    if (byName) return byName;
  }
  return null;
}

function cleanDescription(line: string): string {
  return line
    .replace(CURRENCY_PREFIX, "")
    .replace(CURRENCY_SYMBOL, "")
    .replace(/[\d,]+(?:\.\d{2})?\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseReceipt(text: string, options: ReceiptParserOptions = {}): ParsedReceiptResult {
  const lines = normalizeLines(text);
  const merchant = findMerchant(lines);
  const detectedDate = findDate(lines) ?? options.defaultDate ?? null;
  const fallbackDate = options.defaultDate ?? detectedDate;
  const total = findTotal(lines);
  const parsedLines: ParsedReceiptLine[] = [];

  for (const line of lines) {
    const amountMatch = line.match(AMOUNT_ON_LINE);
    if (!amountMatch?.groups?.amount) continue;
    const rawAmount = parseNumberToken(amountMatch.groups.amount);
    if (rawAmount === null) continue;
    const description = cleanDescription(line);
    if (!description) continue
    const type: ExpenseType = INCOME_KEYWORDS.some((re) => re.test(description)) ? "income" : "expense";
    parsedLines.push({
      description: description.slice(0, 140),
      amount: Math.abs(rawAmount),
      date: detectInlineDate(line) ?? fallbackDate,
      type,
      recurrence: "none",
      suggestedCategoryName: type === "expense" ? suggestCategory(description, options.categoryNames ?? []) : null,
    });
  }

  return {
    merchant,
    detectedDate,
    currency: detectedCurrency(lines) ?? "USD",
    total,
    lines: parsedLines,
  };
}

function detectedCurrency(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(/^([A-Z]{3})\s*[-:]?/);
    if (match) return match[1] ?? null;
  }
  return null;
}

function detectInlineDate(line: string): string | null {
  for (const token of line.trim().split(/\s+/)) {
    const parsed = parseDateToken(token);
    if (parsed) return parsed;
  }
  return null;
}

function normalizeLines(text: string): string[] {
  return (text ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").trim())
    .filter((line) => line.length > 0);
}
