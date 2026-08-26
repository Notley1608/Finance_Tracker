import { ref, watch } from "vue";

export function useExpenses() {
  const page = ref(1);
  const pageSize = ref(16);
  const search = ref("");

  function filterExpenses<T extends { description: string; date: string }>(
    expenses: T[],
  ): T[] {
    const query = search.value.trim().toLowerCase();
    if (!query) return expenses;
    return expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(query) ||
        e.date.toLowerCase().includes(query),
    );
  }

  function paginate<T>(items: T[]): T[] {
    const start = (page.value - 1) * pageSize.value;
    return items.slice(start, start + pageSize.value);
  }

  const totalCount = ref(0);

  function setPageSize(size: number) {
    pageSize.value = size;
    page.value = 1;
  }

  watch(search, () => {
    page.value = 1;
  });

  watch(totalCount, () => {
    const totalPages = Math.max(1, Math.ceil(totalCount.value / pageSize.value));
    if (page.value > totalPages) {
      page.value = totalPages;
    }
  });

  return {
    page,
    pageSize,
    search,
    totalCount,
    filterExpenses,
    paginate,
    setPageSize,
  };
}
