<template>
  <div class="flex flex-col w-full space-y-6">
    <PageHeader :title="title" :description="description" :date="dateText" />

    <div class="flex">
      <StatCards
        :total-spent="totalSpent"
        :expense-count="expenseCount"
        :category-count="categoryCount"
        :avg-per-expense="avgPerExpense"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { definePageMeta } from "#imports";
import { useUserStore } from "~/stores/user";
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";
import { formatDate } from "~/utils";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import PageHeader from "~/components/dashboard/PageHeader.vue";
import StatCards from "~/components/dashboard/StatCards.vue";

definePageMeta({
  title: "Dashboard",
  middleware: "auth",
});

const toast = useToast();
const isLoading = ref(false);

/**
 * Data loading
 */
const userStore = useUserStore();
const user = computed(() => userStore.userData ?? null);

/**
 * Expense data
 */
const expenseStore = useExpenseStore();
const expenses = computed(() => expenseStore.expensesData ?? null);
const monthlySheetData = computed(() => expenseStore.monthlySheetData ?? null);
const monthlySummaryData = computed(
  () => expenseStore.monthlySummaryData ?? null,
);

/**
 * Stat card data
 */
const totalSpent = computed(() => monthlySummaryData.value?.totalSpent ?? 0);
const expenseCount = computed(() => monthlySheetData.value?.length ?? 0);
const categoryCount = computed(
  () =>
    monthlySummaryData.value?.categories.filter((c) => c.amountSpent > 0)
      .length ?? 0,
);
const avgPerExpense = computed(() =>
  expenseCount.value > 0 ? totalSpent.value / expenseCount.value : 0,
);

/**
 * Category data
 */
const categoryStore = useCategoryStore();
const categories = computed(() => categoryStore.categoriesData ?? null);

/**
 * PageHeader
 */
const title = computed(() => `Welcome back ${user.value?.name ?? ""}`);
const description = "This is your financial overview";
const date = new Date();
const dateText = computed(() => `Todays date is ${formatDate(date)}`);
const year = date.getFullYear();
const month = date.getMonth() + 1;

onMounted(async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      userStore.getUser(),
      expenseStore.getAllExpenses(),
      expenseStore.getMonthlySheet(year, month),
      expenseStore.getMonthlySummary(year, month),
      categoryStore.getAllCategories(),
    ]);
  } catch (err: any) {
    toast.add({
      title: "Failed to load data",
      color: "error",
    });
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>
