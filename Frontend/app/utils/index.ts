import { MONTH_NAMES, FALLBACK_COLOURS } from "~/consts";

export const formatTitle = (value: string) => {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export interface MonthInfo {
  key: string;
  year: number;
  month: number;
  label: string;
}

export function monthName(month: number): string | undefined {
  return MONTH_NAMES[month - 1];
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function buildMonthWindow(
  monthsBack: number,
  now = new Date(),
): MonthInfo[] {
  const window: MonthInfo[] = [];
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  for (let i = 0; i < monthsBack; i++) {
    window.unshift({
      key: toMonthKey(year, month),
      year,
      month,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    });

    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return window;
}

export function colourFor(index: number): string | undefined {
  return FALLBACK_COLOURS[index % FALLBACK_COLOURS.length];
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getMonthYear(date: string | Date) {
  return new Date(date).toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });
}

export function formatAmount(value: number) {
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  });
}
