import { ref, watch } from "vue";

export function useCategories() {
  const page = ref(1);
  const pageSize = ref(16);
  const search = ref("");

  function filterCategories<T extends { name: string; expenseCount: number }>(
    categories: T[],
  ): T[] {
    const query = search.value.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(
      (e) => e.name.toLowerCase().includes(query) || e.expenseCount,
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
    const totalPages = Math.max(
      1,
      Math.ceil(totalCount.value / pageSize.value),
    );
    if (page.value > totalPages) {
      page.value = totalPages;
    }
  });

  return {
    page,
    pageSize,
    search,
    totalCount,
    filterCategories,
    paginate,
    setPageSize,
  };
}
