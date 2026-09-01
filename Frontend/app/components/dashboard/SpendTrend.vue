<template>
  <div class="rounded-xl border border-default p-5 bg-white dark:bg-gray-900">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h3 class="text-lg font-semibold text-highlighted">Spending trends</h3>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-for="range in ranges"
          :key="range"
          :label="range"
          color="neutral"
          :variant="selectedRange === range ? 'solid' : 'soft'"
          size="sm"
          @click="selectedRange = range"
        />

        <div class="h-5 border-l border-default mx-1" />

        <UButton
          label="Total"
          color="neutral"
          :variant="viewMode === 'total' ? 'solid' : 'soft'"
          size="sm"
          @click="viewMode = 'total'"
        />
        <UButton
          label="Categories"
          color="neutral"
          :variant="viewMode === 'categories' ? 'solid' : 'soft'"
          size="sm"
          @click="viewMode = 'categories'"
        />
      </div>
    </div>

    <ClientOnly>
      <p v-if="!hasData" class="text-sm text-muted py-8 text-center">
        No spending recorded in this period.
      </p>

      <LineChart
        v-else
        :data="trendData"
        :categories="trendCategories"
        :height="220"
        :x-formatter="(i: number) => xTickLabels.get(i) ?? ''"
        :x-explicit-ticks="monthTickValues"
        x-label="Month"
        y-label="Amount"
        :y-formatter="(v: number) => formatAmount(v)"
        :y-grid-line="true"
        :y-axis-config="{ tickTextFontSize: '12px' }"
        curve-type="monotoneX"
        :hide-legend="viewMode === 'total'"
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
import { computed, ref } from "vue";
import type { Expense } from "~/types/expenses";
import type { Category } from "~/types/categories";
import { buildMonthWindow, colourFor, formatAmount, toMonthKey } from "~/utils";

const props = defineProps<{ expenses: Expense[]; categories: Category[] }>();

const ranges = ["6M", "1Y", "2Y", "5Y"];
const rangeMonths: Record<string, number> = {
  "6M": 6,
  "1Y": 12,
  "2Y": 24,
  "5Y": 60,
};
const selectedRange = ref<string>("6M");
const rangeStart = computed(() => `${months.value[0]?.key ?? ""}-01`);

const viewMode = ref<"total" | "categories">("total");
const months = computed(() =>
  buildMonthWindow(rangeMonths[selectedRange.value] ?? 0),
);

const windowedExpenses = computed(() =>
  props.expenses.filter((e) => e.date >= rangeStart.value),
);

const isYearly = computed(
  () => (rangeMonths[selectedRange.value] ?? 0) >= 24,
);

const xTickLabels = computed(() => {
  const labels = new Map<number, string>();
  months.value.forEach((m, i) => {
    if (isYearly.value) {
      if (m.month === 1 || i === months.value.length - 1) {
        labels.set(i, String(m.year));
      }
    } else {
      labels.set(i, m.label);
    }
  });
  return labels;
});

const monthTickValues = computed(() => [...xTickLabels.value.keys()]);

const totalByMonth = computed(() => {
  const sums = new Map<string, number>();
  for (const e of windowedExpenses.value) {
    const [year, month] = e.date.split("-").map(Number);
    const key = toMonthKey(year, month);
    sums.set(key, (sums.get(key) ?? 0) + Number(e.amount));
  }
  return months.value.map((m) => ({
    month: m.key,
    total: sums.get(m.key) ?? 0,
  }));
});

const activeCategoryIds = computed(() => {
  const inWindow = new Set(windowedExpenses.value.map((e) => e.categoryId));
  return props.categories.map((c) => c.id).filter((id) => inWindow.has(id));
});
const byCategoryByMonth = computed(() => {
  const monthly = new Map<string, Map<string, number>>();
  for (const e of windowedExpenses.value) {
    const [year, month] = e.date.split("-").map(Number);
    const mkey = toMonthKey(year, month);
    if (!monthly.has(mkey)) monthly.set(mkey, new Map());
    const cats = monthly.get(mkey)!;
    cats.set(e.categoryId, (cats.get(e.categoryId) ?? 0) + Number(e.amount));
  }
  return months.value.map((m) => {
    const row: Record<string, number | string> = { month: m.key };
    const cats = monthly.get(m.key);
    for (const id of activeCategoryIds.value) row[id] = cats?.get(id) ?? 0;
    return row;
  });
});

const trendData = computed(() =>
  viewMode.value === "total" ? totalByMonth.value : byCategoryByMonth.value,
);
const trendCategories = computed(() => {
  if (viewMode.value === "total") {
    return { total: { name: "Total", color: "#6366f1" } };
  }
  const byId = new Map(props.categories.map((c) => [c.id, c]));
  const config: Record<string, { name: string; color: string }> = {};
  activeCategoryIds.value.forEach((id, i) => {
    const cat = byId.get(id);
    config[id] = {
      name: cat?.name ?? "Unknown",
      color: cat?.colour ?? colourFor(i),
    };
  });
  return config;
});

const hasData = computed(() =>
  trendData.value.some((row) =>
    Object.values(row).some((v) => typeof v === "number" && v > 0),
  ),
);
</script>
