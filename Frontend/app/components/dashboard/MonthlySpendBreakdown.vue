<template>
  <div class="rounded-xl border border-default p-5 bg-white dark:bg-gray-900">
    <div>
      <h3>Spending by category</h3>
      <UButton
        :label="`${month} ${year}`"
        icon="i-heroicons-chevron-right"
        @keyup.enter="emit('change', { year, month })"
      />
    </div>

    <ClientOnly>
      <BarChart
        :data="rows"
        :categories="categories"
        :x-formatter="(i: number) => rows[i]?.category ?? ''"
        :x-axis="'category'"
        :y-axis="['amount']"
        x-label="Category"
        y-label="Amount"
        :height="300"
        :padding="{ left: 60 }"
      />
      <template #fallback>...placeholder</template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Category } from "~/types/categories";
import type { MonthlySummary } from "~/types/expenses";

const props = defineProps<{
  categories: Category[];
  summary: MonthlySummary | null;
  month: number;
  year: number;
}>();
const emit = defineEmits<{
  (e: "change", payload: { year: number; month: number }): void;
}>();

const categoryNameById = computed(() => {
  const map = new Map(props.categories.map((c) => [c.id, c.name]));
  return (id: string) => map.get(id) ?? "Deleted category";
});
const rows = computed(
  () =>
    props.summary?.categories
      .filter((c) => c.amountSpent > 0)
      .map((c) => ({
        category: categoryNameById.value(c.categoryId),
        amount: c.amountSpent,
      })) ?? [],
);
</script>
