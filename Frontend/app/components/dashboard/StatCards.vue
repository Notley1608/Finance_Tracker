<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      label="Total spent"
      :value="formattedExpenseCount"
      icon="i-heroicons-currency-dollar"
      colour="primary"
    />

    <StatCard
      label="Total expenses this month"
      :value="String(expenseCount)"
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
      :value="`$${avgPerExpense}`"
      icon="i-heroicons-calculator"
      colour="neutral"
    />
  </div>
</template>

<script setup lang="ts">
import StatCard from "./StatCard.vue";

const props = defineProps<{
  totalSpent: number;
  expenseCount: number;
  categoryCount: number;
  avgPerExpense: number;
}>();

const formattedExpenseCount = props.expenseCount.toLocaleString("en-AU", {
  minimumFractionDigits: 2,
});
</script>
