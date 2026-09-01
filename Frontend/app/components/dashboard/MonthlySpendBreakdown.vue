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
          {{ monthNameText }}
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
      v-if="amounts.length === 0 || loading === true"
      class="text-sm text-muted py-8 text-center"
    >
      No expenses recorded for {{ monthNameText }}.
    </p>

    <ClientOnly v-else>
      <DonutChart
        :data="amounts"
        :categories="donutCategories"
        :height="260"
        :radius="6"
        :arc-width="24"
        :pad-angle="0"
        :legend-style="{ marginTop: '12px' }"
      />
      <template #fallback>
        <div
          class="h-[300px] flex items-center justify-center text-sm text-muted"
        >
          Loading chart...
        </div>
      </template>
    </ClientOnly>

    <div
      v-if="biggestSegment"
      class="flex items-center justify-between mt-4 pt-3 border-t border-default"
    >
      <div class="flex items-center gap-2">
        <span
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: biggestSegment.colour ?? colourFor(0) }"
        />
        <span class="text-sm text-muted"
          >Biggest spend in {{ monthNameText }}:
        </span>
      </div>
      <span class="text-sm font-semibold text-highlighted">
        {{ biggestSegment.name }} {{ formatAmount(biggestSegment.amount) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Category } from "~/types/categories";
import type { MonthlySummary } from "~/types/expenses";
import { colourFor, formatAmount, monthName } from "~/utils";

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

const monthNameText = computed(
  () => `${monthName(props.month)} ${props.year}`,
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

const categoryById = computed(() => {
  const map = new Map<string, Category>();
  props.categories.forEach((c) => map.set(c.id, c));
  return map;
});

const segments = computed(() => {
  const byId = categoryById.value;
  return (props.summary?.categories ?? [])
    .filter((c) => c.amountSpent > 0)
    .map((c) => ({
      name: byId.get(c.categoryId)?.name ?? "Deleted category",
      colour: byId.get(c.categoryId)?.colour,
      amount: c.amountSpent,
    }));
});

const biggestSegment = computed(
  () => [...segments.value].sort((a, b) => b.amount - a.amount)[0] ?? null,
);

const amounts = computed(() => segments.value.map((s) => s.amount));

const donutCategories = computed(() => {
  const config: Record<string, { name: string; color: string }> = {};
  segments.value.forEach((s, index) => {
    config[s.name] = { name: s.name, color: s.colour ?? colourFor(index) };
  });
  return config;
});
</script>
