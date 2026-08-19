<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
    <!-- Filter -->
    <div
      class="flex items-center justify-between border-b border-default px-4 py-4"
    >
      <UInput
        v-model="globalFilter"
        class="w-full max-w-sm"
        placeholder="Filter expenses..."
        icon="i-lucide-search"
      />
    </div>

    <!-- Table -->
    <div
      class="overflow-hidden rounded-xl border border-default bg-white shadow-sm dark:bg-gray-900"
    >
      <UTable
        ref="table"
        class="w-full"
        v-model:global-filter="globalFilter"
        v-model:sorting="sorting"
        :data="expenseData"
        :columns="columns"
        :loading="isLoading"
      >
        <template #description-data="{ row }">
          <span class="font-medium text-highlighted">
            {{ row.original.description }}
          </span>
        </template>

        <template #amount-data="{ row }">
          <span class="font-medium tabular-nums text-highlighted">
            ${{ row.original.amount }}
          </span>
        </template>

        <template #category-data="{ row }">
          <UBadge color="neutral" variant="subtle" size="sm">
            {{ row.original.category }}
          </UBadge>
        </template>

        <template #date-data="{ row }">
          <span class="text-sm text-muted">
            {{ formatDate(row.original.date) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu
            :items="getRowItem(row.original)"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Actions"
            />
          </UDropdownMenu>
        </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div
      class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
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
        :total="expenseData?.length ?? 0"
        @update:page="(p: number) => (pagination.pageIndex = p - 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Expense } from "~/types/expenses";
import type { Category } from "~/types/categories";
import type { TableColumn } from "@nuxt/ui";
import { formatDate } from "~/utils/index.ts";

const props = defineProps<{
  expenses: Expense[] | null;
  categories: Category[] | null;
  isLoading: boolean;
}>();
const emit = defineEmits(["edit", "delete"]);

const expenseData = computed(
  () =>
    props.expenses?.map((expense) => ({
      ...expense,
      amount: `$${expense.amount}`,
      category:
        props.categories?.find((category) => category.id === expense.categoryId)
          ?.name ?? "Unknown",
    })) ?? [],
);

const pagination = ref({
  pageIndex: 0,
  pageSize: 16,
});
const pageSizes = [16, 24, 32];

function setPageSize(size: number) {
  pagination.value.pageSize = size;
  pagination.value.pageIndex = 0;
}

const globalFilter = ref("");

const sorting = ref([
  {
    id: "date",
    desc: true,
  },
]);

const columns: TableColumn<Expense>[] = [
  {
    accessorKey: "description",
    header: "Description",
    meta: {
      class: {
        th: "w-[35%] px-6 py-4",
        td: "px-6 py-5",
      },
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: {
      class: {
        th: "w-[15%] px-6 py-4",
        td: "px-6 py-5",
      },
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: {
      class: {
        th: "w-[20%] px-6 py-4",
        td: "px-6 py-5",
      },
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    meta: {
      class: {
        th: "w-[25%] px-6 py-4",
        td: "px-6 py-5",
      },
    },
  },
  {
    id: "actions",
    header: "",
    meta: {
      class: {
        th: "w-12 px-4",
        td: "px-4 py-5 text-right",
      },
    },
  },
];

function getRowItem(row: Expense) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Edit",
      onSelect: () => emit("edit", row),
    },
    {
      label: "Delete",
      onSelect: () => emit("delete", row),
    },
  ];
}
</script>
