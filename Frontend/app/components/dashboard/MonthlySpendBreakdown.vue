<template>
  <div class="rounded-xl border border-default p-5 bg-white dark:bg-gray-900">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-highlighted">
        Spending by category
      </h3>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-chevron-left"
          color="neutral"
          variant="soft"
          size="sm"
          aria-label="Previous month"
          @click="goToPrevMonth"
        />
        <span class="text-sm font-medium text-muted w-24 text-center">
          {{ monthName }}
        </span>
        <UButton
          icon="i-heroicons-chevron-right"
          color="neutral"
          variant="soft"
          size="sm"
          aria-label="Next month"
          @click="goToNextMonth"
        />
        <UButton
          label="This month"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="isCurrentMonth"
          @click="emit('change', { year: currentYear, month: currentMonth })"
        />
      </div>
    </div>

    <p
      v-if="rows.length === 0 || loading === true"
      class="text-sm text-muted py-8 text-center"
    >
      No expenses recorded for {{ monthName }}.
    </p>

    <ClientOnly v-else>
      <BarChart
        :data="rows"
        :categories="chartCategories"
        :x-formatter="(i: number) => rows[i]?.category ?? ''"
        :y-axis="seriesKeys"
        x-label="Category"
        y-label="Amount"
        :height="300"
        :padding="{ left: 60 }"
      />
      <template #fallback>
        <div
          class="h-[300px] flex items-center justify-center text-sm text-muted"
        >
          Loading chart...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Category } from "~/types/categories";
import type { MonthlySummary } from "~/types/expenses";
import { MONTH_NAMES, FALLBACK_COLOURS } from "~/consts";

const props = defineProps<{
  categories: Category[];
  summary: MonthlySummary | null;
  month: number;
  year: number;
  loading: boolean;
}>();
const emit = defineEmits<{
  (e: "change", payload: { year: number; month: number }): void;
}>();

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const isCurrentMonth = computed(
  () => props.year === currentYear && props.month === currentMonth,
);

const monthName = computed(
  () => `${MONTH_NAMES[props.month - 1]} ${props.year}`,
);

function goToPrevMonth() {
  const { year, month } = props;
  emit(
    "change",
    month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 },
  );
}

function goToNextMonth() {
  const { year, month } = props;
  emit(
    "change",
    month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 },
  );
}

function colourFor(index: number): string {
  return FALLBACK_COLOURS[index % FALLBACK_COLOURS.length];
}

const categoryById = computed(() => {
  const map = new Map<string, Category>();
  props.categories.forEach((c) => map.set(c.id, c));
  return map;
});

const activeCategories = computed(() =>
  (props.summary?.categories ?? [])
    .filter((c) => c.amountSpent > 0)
    .map((c) => ({ id: c.categoryId, amount: c.amountSpent })),
);

const rows = computed(() =>
  activeCategories.value.map((c) => ({
    category: categoryById.value.get(c.id)?.name ?? "Deleted category",
    [c.id]: c.amount,
  })),
);

const seriesKeys = computed(() => activeCategories.value.map((c) => c.id));

const chartCategories = computed(() => {
  const config: Record<string, { name: string; color: string }> = {};
  props.categories.forEach((cat, index) => {
    config[cat.id] = { name: cat.name, color: cat.colour ?? colourFor(index) };
  });
  return config;
});
</script>
