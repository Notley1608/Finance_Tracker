import type { RecurrencePattern } from "../entities/expense.entity";

export function isSameMonth(
  isoDate: string,
  year: number,
  monthZeroIndexed: number,
): boolean {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.getUTCFullYear() === year && d.getUTCMonth() === monthZeroIndexed;
}

function clampedDate(year: number, monthZeroIndexed: number, day: number): Date {
  const lastDay = new Date(
    Date.UTC(year, monthZeroIndexed + 1, 0),
  ).getUTCDate();
  return new Date(Date.UTC(year, monthZeroIndexed, Math.min(day, lastDay)));
}

/**
 * Returns the ISO dates on which `templateDate` recurs inside the target
 * month. Templates whose own date already falls in the target month are
 * represented by their physical row and therefore skipped.
 */
export function occurrencesForMonth(
  templateDate: string,
  recurrence: RecurrencePattern,
  targetYear: number,
  targetMonthZeroIndexed: number,
): string[] {
  if (
    recurrence === "none" ||
    isSameMonth(templateDate, targetYear, targetMonthZeroIndexed)
  ) {
    return [];
  }

  const start = new Date(`${templateDate}T00:00:00Z`);
  const targetMonthStart = new Date(
    Date.UTC(targetYear, targetMonthZeroIndexed, 1),
  );

  if (start >= targetMonthStart) {
    return [];
  }

  const occurrences: string[] = [];

  if (recurrence === "weekly") {
    let cursor = new Date(start);
    while (cursor < targetMonthStart) {
      cursor = new Date(cursor.getTime() + 7 * 86400000);
    }
    let guard = 0;
    while (
      cursor.getUTCFullYear() === targetYear &&
      cursor.getUTCMonth() === targetMonthZeroIndexed &&
      guard++ < 200
    ) {
      occurrences.push(cursor.toISOString().slice(0, 10));
      cursor = new Date(cursor.getTime() + 7 * 86400000);
    }
    return occurrences;
  }

  const stepMonths = recurrence === "yearly" ? 12 : 1;
  const day = start.getUTCDate();
  let cursorYear = start.getUTCFullYear();
  let cursorMonth = start.getUTCMonth();
  let cursor = new Date(Date.UTC(cursorYear, cursorMonth, day));
  let guard = 0;

  while (cursor < targetMonthStart && guard++ < 2400) {
    cursorYear = cursor.getUTCFullYear();
    cursorMonth = cursor.getUTCMonth();
    cursor = clampedDate(cursorYear, cursorMonth + stepMonths, day);
  }

  if (
    cursor.getUTCFullYear() === targetYear &&
    cursor.getUTCMonth() === targetMonthZeroIndexed
  ) {
    occurrences.push(cursor.toISOString().slice(0, 10));
  }

  return occurrences;
}