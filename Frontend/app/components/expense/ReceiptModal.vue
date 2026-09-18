<template>
  <UModal
    v-model:open="isOpen"
    title="Import receipt"
    description="Upload a receipt to create expenses automatically"
    class="sm:max-w-3xl"
  >
    <template #body>
      <div class="p-5">
        <template v-if="parsedResult">
          <div
            class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-default pb-4"
          >
            <span
              v-if="parsedResult.merchant"
              class="font-semibold text-highlighted"
            >
              {{ parsedResult.merchant }}
            </span>
            <span
              v-if="parsedResult.detectedDate"
              class="text-sm text-muted"
            >
              {{ formatDate(parsedResult.detectedDate) }}
            </span>
            <span
              v-if="parsedResult.total !== null"
              class="ml-auto text-sm font-medium tabular-nums"
            >
              Total: {{ formatAmount(parsedResult.total) }}
            </span>
          </div>

          <div class="mb-4 space-y-3">
            <div
              v-for="(row, index) in lineRows"
              :key="index"
              class="grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-12"
            >
              <UFormField label="Description" class="sm:col-span-5">
                <UInput v-model="row.description" />
              </UFormField>

              <UFormField label="Amount" class="sm:col-span-3">
                <UInput v-model="row.amount" type="number" min="0" step="0.01" />
              </UFormField>

              <UFormField label="Category" class="sm:col-span-4">
                <div class="flex items-center gap-2">
                  <USelect
                    v-model="row.categoryId"
                    :items="categoryOptions"
                    placeholder="Uncategorized"
                    class="w-full"
                  />
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove line"
                    @click="removeLine(index)"
                  />
                </div>
              </UFormField>

              <UFormField label="Date" class="sm:col-span-4">
                <UInput v-model="row.date" type="date" />
              </UFormField>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UButton :loading="isSaving" @click="handleSubmit">
              Save {{ lineRows.length }} expense{{ lineRows.length === 1 ? "" : "s" }}
            </UButton>
            <UButton variant="outline" @click="resetParsed">
              Upload another
            </UButton>
            <UButton variant="ghost" @click="close">
              Cancel
            </UButton>
          </div>
        </template>

        <template v-else>
          <UFileUpload
            v-model="selectedFile"
            accept="image/*,application/pdf,.jpg,.jpeg,.png,.webp,.heic"
            :dropzone="true"
            :preview="false"
            :reset="true"
            label="Choose a receipt image or PDF"
            description="Drag & drop or click to browse. Max 10MB."
          />

          <div v-if="error" class="mt-4">
            <UAlert color="error" :title="error" />
          </div>
        </template>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import type {
  ExpensePayload,
  ExpenseType,
  RecurrencePattern,
} from "~/types/expenses";
import type { ParsedReceiptResult } from "~/types/receipts";
import { useReceiptsApi } from "~/api/modules/receipts";
import { formatDate, formatAmount, getErrorMessage } from "~/utils";

interface LineReviewItem {
  description: string;
  amount: string;
  categoryId: string;
  date: string;
  type: ExpenseType;
  recurrence: RecurrencePattern;
}

const props = defineProps<{
  categoryMap: Record<string, string>;
}>();

const emit = defineEmits<{
  submit: [payloads: ExpensePayload[]];
}>();

const receiptsApi = useReceiptsApi();
const toast = useToast();

const isOpen = ref(false);
const isUploading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const parsedResult = ref<ParsedReceiptResult | null>(null);
const lineRows = ref<LineReviewItem[]>([]);

const categoryOptions = computed(() =>
  Object.entries(props.categoryMap).map(([id, name]) => ({
    label: name,
    value: id,
  })),
);

const today = () => new Date().toISOString().slice(0, 10);

const categoryIdForName = (name: string | null): string => {
  if (!name) return "";
  const match = Object.entries(props.categoryMap).find(
    ([, categoryName]) => categoryName.toLowerCase() === name.toLowerCase(),
  );
  return match?.[0] ?? "";
};

const open = () => {
  isOpen.value = true;
  error.value = null;
};

const close = () => {
  isOpen.value = false;
  resetState();
};

const resetState = () => {
  parsedResult.value = null;
  lineRows.value = [];
  error.value = null;
  selectedFile.value = null;
};

const resetParsed = () => {
  parsedResult.value = null;
  lineRows.value = [];
  error.value = null;
  selectedFile.value = null;
};

watch(selectedFile, async (file) => {
  if (!file || isUploading.value) return;

  isUploading.value = true;
  error.value = null;

  try {
    const result = await receiptsApi.uploadReceipt(file);
    parsedResult.value = result;

    const fallbackDate = result.detectedDate ?? today();
    lineRows.value = (result.lines ?? []).map((line) => ({
      description: line.description,
      amount: String(line.amount),
      categoryId: categoryIdForName(line.suggestedCategoryName),
      date: line.date ?? fallbackDate,
      type: line.type,
      recurrence: line.recurrence,
    }));
  } catch (err) {
    error.value = getErrorMessage(err) || "Failed to read receipt";
    toast.add({
      title: "Receipt import failed",
      color: "error",
    });
  } finally {
    isUploading.value = false;
  }
});

const removeLine = (index: number) => {
  lineRows.value.splice(index, 1);
};

const handleSubmit = async () => {
  const payloads: ExpensePayload[] = [];

  for (const row of lineRows.value) {
    if (!row.description.trim()) continue;

    const amount = Number(row.amount);
    if (Number.isNaN(amount) || amount <= 0) continue;

    payloads.push({
      categoryId: row.categoryId || null,
      amount,
      description: row.description.trim(),
      date: row.date || today(),
      type: row.type,
      recurrence: row.recurrence,
    });
  }

  if (payloads.length === 0) {
    toast.add({
      title: "Nothing to save",
      description: "Add at least one valid line",
      color: "warning",
    });
    return;
  }

  isSaving.value = true;
  try {
    emit("submit", payloads);
  } finally {
    isSaving.value = false;
  }
};

defineExpose({
  open,
  close,
});
</script>