<template>
  <div>
    <div class="flex px-4 py-3.5 border-b border-accented">
      <UInput v-model="globalFilter" class="max-w-sm" placeholder="Filter..." />
    </div>
    <UTable
      ref="table"
      class="flex flex-1"
      v-model:global-filter="globalFilter"
      :data="expenseData"
      :is-loading
    />

    <div class="flex items-center justify-between border-t border-default pt-4">
      <UFieldGroup>
        <UButton
          v-for="size in pageSizes"
          :key="size"
          :label="String(size)"
          :color="pagination.pageSize === size ? 'primary' : 'neutral'"
          :variant="pagination.pageSize === size ? 'solid' : 'outline'"
          @click="setPageSize(size)"
        />
      </UFieldGroup>

      <UPagination
        :default-page="pagination.pageIndex + 1"
        :items-per-page="pagination.pageSize"
        :total="expenseData?.length"
        @update:page="(p: number) => (pagination.pageIndex = p - 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useTemplateRef } from "#imports";
import type { Expense } from "~/types/expenses";
import type { Category } from "~/types/categories";

const props = defineProps<{
  expenses: Expense[] | null;
  categories: Category[] | null;
  isLoading: boolean;
}>();
const emit = defineEmits(["edit", "delete"]);

const expenseData = computed(() =>
  props.expenses?.map((expense) => ({
    description: expense.description,
    amount: expense.amount,
    category:
      props.categories?.find((category) => category.id === expense.categoryId)
        ?.name ?? "Unknown",
    date: expense.date,
  })),
);

const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});
const pageSizes = [16, 24, 32];

function setPageSize(size: number) {
  pagination.value.pageSize = size;
  pagination.value.pageIndex = 0;
}

const globalFilter = ref("");
</script>
