<template>
  <UModal v-model:open="isOpen" title="Expense details" class="sm:max-w-2xl">
    <template #body>
      <div class="p-5">
        <section class="mb-5">
          <UForm
            :state="state"
            :schema="schema"
            class="space-y-4"
            @submit="handleSubmit"
          >
            <UFormField label="description">
              <UInput v-model="state.description" />
            </UFormField>

            <UFormField label="amount">
              <UInput v-model="state.amount" />
            </UFormField>

            <UFormField label="category">
              <USelect
                v-model="state.categoryId"
                :items="
                  Object.entries(categoryMap).map(([id, name]) => ({
                    label: name,
                    value: id,
                  }))
                "
              />
            </UFormField>

            <UFormField label="date">
              <UInput type="date" v-model="state.date" />
            </UFormField>

            <div class="mb-5">
              <UButton type="submit"> Save </UButton>
              <UButton variant="outline" @click="cancel()"> Cancel </UButton>
            </div>
          </UForm>
        </section>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import * as z from "zod";
import type { Expense, ExpensePayload } from "~/types/expenses";

const props = defineProps<{
  categoryMap: Record<string, string>;
}>();

const isOpen = ref(false);

const editingExpense = ref<Expense | null>(null);

const open = (expense?: Expense) => {
  editingExpense.value = expense ?? null;

  if (expense) {
    state.description = expense.description;
    state.amount = expense.amount;
    state.categoryId = expense.categoryId;
    state.date = expense.date;
  } else {
    resetState();
  }

  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  editingExpense.value = null;
  resetState();
};

const cancel = () => {
  emit("cancel");
};

const emit = defineEmits<{
  submit: [payload: ExpensePayload];
  cancel: [];
}>();

const schema = z.object({
  description: z.string().nonempty("Cannot be empty"),
  amount: z.string().nonempty("Amount is required"),
  categoryId: z.string().nonempty("Must be tied to a category"),
  date: z.string().nonempty("Invalid date"),
});

const state = reactive({
  description: "",
  amount: "",
  categoryId: "",
  date: "",
});

const resetState = () => {
  if (editingExpense.value) {
    state.description = editingExpense.value.description;
    state.amount = editingExpense.value.amount;
    state.categoryId = editingExpense.value.categoryId;
    state.date = editingExpense.value.date;
  } else {
    state.description = "";
    state.amount = "";
    state.categoryId = "";
    state.date = "";
  }
};

const handleSubmit = () => {
  const amount = parseFloat(state.amount);
  if (Number.isNaN(amount)) {
    throw new Error("Invalid amount");
  }

  const payload: ExpensePayload = {
    categoryId: state.categoryId,
    amount,
    description: state.description,
    date: state.date,
  };

  emit("submit", payload);
};

defineExpose({
  open,
  close,
});
</script>
