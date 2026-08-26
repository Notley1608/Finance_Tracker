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
        <template #name-header>
          <button
            class="flex items-center gap-1 font-semibold hover:text-highlighted cursor-pointer"
            @click="handleSort('description')"
          >
            Name
            <span v-if="isActiveSort('description')" class="text-muted text-xs">
              {{ activeSortDesc ? "↓" : "↑" }}
            </span>
          </button>
        </template>

        <template #expense-associated-header>
          <button
            class="flex items-center gap-1 font-semibold hover:text-highlighted cursor-pointer"
            @click="handleSort('amount')"
          >
            Expense count
            <span v-if="isActiveSort('amount')" class="text-muted text-xs">
              {{ activeSortDesc ? "↓" : "↑" }}
            </span>
          </button>
        </template>

        <template #name-cell="{ row }">
          <span class="font-medium text-highlighted">
            {{ row.original.name }}
          </span>
        </template>

        <template #expense-associated-cell="{ row }">
          <span class="font-medium tabular-nums text-highlighted">
            ${{ row.original.expenses }}
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
import type { Category } from "~/types/categories";
import type { TableColumn } from "@nuxt/ui";
import { useCategories } from "~/composables/useCategories";

const props = defineProps<{
  categories: Category[] | null;
  isLoading: boolean;
}>();
const emit = defineEmits(["edit", "delete"]);

const {
  page,
  pageSize,
  search,
  totalCount,
  filterCategories,
  paginate,
  setPageSize,
} = useCategories();

const filteredCategories = computed(() =>
  filterCategories(props.categories || []),
);

/**
 * Sorting
 */
const sorting = ref([{ id: "name", desc: true }]);
const sortedCategories = computed(() => {
  const sort = sorting.value[0];
  if (!sort) {
    return filteredCategories.value;
  }

  return [...filteredCategories.value].sort((a, b) => {
    const aVal = a[sort.id as keyof typeof a] ?? "";
    const bVal = b[sort.id as keyof typeof b] ?? "";

    let cmp: number;

    cmp = String(aVal).localeCompare(String(bVal), undefined, {
      sensitivity: "base",
    });

    return sort.desc ? -cmp : cmp;
  });
});

watch(
  sortedCategories,
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

function handleSort(colId: string) {
  if (sorting.value[0]?.id === colId) {
    sorting.value = [{ id: colId, desc: !sorting.value[0].desc }];
  } else {
    sorting.value = [{ id: colId, desc: false }];
  }
}

/**
 * Pagination
 */
const pageSizes = [16, 24, 32];
const displayData = computed(() => paginate(sortedCategories.value));

/**
 * Columns
 */
const columns: TableColumn<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: {
      class: {
        th: "w-[35%] px-6 py-4",
        td: "px-6 py-5",
      },
    },
  },
  {
    accessorKey: "expenses-count",
    header: "Expenses count",
    meta: {
      class: {
        th: "w-[35%] px-6 py-4",
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

function getRowItem(row: Category) {
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
