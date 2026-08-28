<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      label="Total spent"
      :value="String(totalSpent)"
      icon="i-heroicons-currency-dollar"
    />

    <StatCard
      label="Total expenses this month"
      :value="formattedExpenseCount"
      icon="i-heroicons-receipt"
      colour="neutral"
    />
    <StatCard
      label="Categories in use"
      :value="String(categoryCount)"
      icon="i-heroicons-tag"
      colour="neutral"
    />
    <StatCard
      label="Average per expense"
      :value="formattedAvgPerExpense"
      icon="i-heroicons-calculator"
      colour="neutral"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import StatCard from "./StatCard.vue";

const props = defineProps<{
  totalSpent: number;
  expenseCount: number;
  categoryCount: number;
  avgPerExpense: number;
}>();

const formattedExpenseCount = computed(() =>
  props.expenseCount.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
  }),
);
const formattedAvgPerExpense = computed(
  () =>
    `$${props.avgPerExpense.toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
);
</script>
