<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mb-6">
    <div
      class="flex items-center justify-between border-b border-default px-4 py-4"
    >
      <UInput
        v-model="search"
        class="w-full max-w-sm"
        placeholder="Filter expenses..."
        icon="i-lucide-search"
      />

      <div class="flex items-center gap-2">
        <slot name="toolbar" />
      </div>
    </div>

    <div
      class="overflow-hidden rounded-xl border border-default bg-white shadow-sm dark:bg-gray-900"
    >
      <UTable
        ref="table"
        class="w-full"
        :data="displayData"
        :columns="columns"
        :loading="isLoading"
      >
        <template #description-header>
          <button
            class="flex items-center gap-1 font-semibold hover:text-highlighted cursor-pointer"
            @click="handleSort('description')"
          >
            Description
            <span v-if="isActiveSort('description')" class="text-muted text-xs">
              {{ activeSortDesc ? "↓" : "↑" }}
            </span>
          </button>
        </template>

        <template #amount-header>
          <button
            class="flex items-center gap-1 font-semibold hover:text-highlighted cursor-pointer"
            @click="handleSort('amount')"
          >
            Amount
            <span v-if="isActiveSort('amount')" class="text-muted text-xs">
              {{ activeSortDesc ? "↓" : "↑" }}
            </span>
          </button>
        </template>

        <template #category-header>
          <button
            class="flex items-center gap-1 font-semibold hover:text-highlighted cursor-pointer"
            @click="handleSort('category')"
          >
            Category
            <span v-if="isActiveSort('category')" class="text-muted text-xs">
              {{ activeSortDesc ? "↓" : "↑" }}
            </span>
          </button>
        </template>

        <template #date-header>
          <button
            class="flex items-center gap-1 font-semibold hover:text-highlighted cursor-pointer"
            @click="handleSort('date')"
          >
            Date
            <span v-if="isActiveSort('date')" class="text-muted text-xs">
              {{ activeSortDesc ? "↓" : "↑" }}
            </span>
          </button>
        </template>

        <template #description-cell="{ row }">
          <span class="font-medium text-highlighted">
            {{ row.original.description }}
          </span>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-medium tabular-nums text-highlighted">
            ${{ row.original.amount }}
          </span>
        </template>

        <template #category-cell="{ row }">
          <UBadge color="neutral" variant="subtle" size="sm">
            {{ row.original.category }}
          </UBadge>
        </template>

        <template #date-cell="{ row }">
          {{ formatDate(row.original.date) }}
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

    <div
      class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <UFieldGroup>
        <UButton
          v-for="size in pageSizes"
          :key="size"
          :label="String(size)"
          :color="pageSize === size ? 'primary' : 'neutral'"
          :variant="pageSize === size ? 'solid' : 'outline'"
          @click="setPageSize(size)"
        />
      </UFieldGroup>

      <UPagination
        :default-page="page"
        :items-per-page="pageSize"
        :total="totalCount"
        @update:page="(p: number) => (page = p)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Expense } from "~/types/expenses";
import type { TableColumn } from "@nuxt/ui";
import { formatDate } from "~/utils/index.ts";
import { useExpenses } from "~/composables/useExpenses";

const props = defineProps<{
  expenses: Expense[] | null;
  categoryMap: Record<string, string>;
  isLoading: boolean;
}>();
const emit = defineEmits(["edit", "delete"]);

const { page, pageSize, search, totalCount, filterExpenses, paginate, setPageSize } =
  useExpenses();

const mappedExpenses = computed(
  () =>
    props.expenses?.map((expense) => ({
      ...expense,
      category: props.categoryMap[expense.categoryId] ?? "Unknown",
    })) ?? [],
);

const filteredExpenses = computed(() => filterExpenses(mappedExpenses.value));

const sorting = ref([{ id: "date", desc: true }]);

const sortedExpenses = computed(() => {
  const sort = sorting.value[0];

  if (!sort) {
    return filteredExpenses.value;
  }

  return [...filteredExpenses.value].sort((a, b) => {
    const aVal = a[sort.id as keyof typeof a] ?? "";
    const bVal = b[sort.id as keyof typeof b] ?? "";

    let cmp: number;

    if (sort.id === "amount") {
      cmp = Number(aVal) - Number(bVal);
    } else {
      cmp = String(aVal).localeCompare(
        String(bVal),
        undefined,
        { sensitivity: "base" },
      );
    }

    return sort.desc ? -cmp : cmp;
  });
});

watch(
  sortedExpenses,
  (items) => {
    totalCount.value = items.length;
  },
  { immediate: true },
);

const activeSortId = computed(() => sorting.value[0]?.id ?? "");
const activeSortDesc = computed(() => sorting.value[0]?.desc ?? true);

function isActiveSort(colId: string) {
  return activeSortId.value === colId;
}

const displayData = computed(() => paginate(sortedExpenses.value));

function handleSort(colId: string) {
  if (sorting.value[0]?.id === colId) {
    sorting.value = [{ id: colId, desc: !sorting.value[0].desc }];
  } else {
    sorting.value = [{ id: colId, desc: false }];
  }
}

const pageSizes = [16, 24, 32];

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
