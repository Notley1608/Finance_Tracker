<template>
  <UModal
    v-model:open="isOpen"
    title="Profile Settings"
    description="Manage your account settings"
    class="sm:max-w-2xl"
  >
    <template #body>
      <div class="pa5">
        <!-- General -->
        <section class="mb5">
          <h3 class="f4 fw6 ma0 mb2">General</h3>

          <UForm :state="state" :schema="schema" class="space-y-4">
            <UFormField label="Name">
              <UInput v-model="state.name" v-if="isEditing" />
              <span v-else class="block py-1.5 text-sm text-highlighted">
                {{ state.name }}
              </span>
            </UFormField>

            <UFormField label="Email">
              <UInput v-model="state.email" v-if="isEditing" />
              <span v-else class="block py-1.5 text-sm text-highlighted">
                {{ state.email }}
              </span>
            </UFormField>

            <div>
              <UButton v-if="!isEditing" @click="isEditing = true">
                Edit
              </UButton>

              <div v-else class="flex gap-2">
                <UButton type="submit" @click="saveProfile"> Save </UButton>

                <UButton variant="outline" @click="cancelEdit">
                  Cancel
                </UButton>
              </div>
            </div>
          </UForm>
        </section>

        <!-- Security -->
        <section class="bt b--black-10 pt5 mb5">
          <h3 class="f4 fw6 ma0 mb3">Security</h3>

          <UButton
            icon="arrow-right-circle"
            variant="soft"
            @click="changePassword"
          >
            Change password
          </UButton>
        </section>

        <!-- Danger Zone -->
        <section class="bt b--black-10 pt5">
          <h3 class="f4 fw6 ma0 mb3">Danger Zone</h3>

          <div class="flex flex-column gap-3">
            <UButton icon="trash" variant="soft"> Delete account </UButton>

            <UButton icon="arrow-down-on-square-stack" variant="soft">
              Export data
            </UButton>
          </div>
        </section>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from "vue";
import * as z from "zod";
import { useUserStore } from "~/stores/user";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import type { updateUserPayload, User } from "~/types/users";

const userStore = useUserStore();
const userData = computed(() => userStore.userData);
const profile = computed(() => userData.value);
const isEditing = ref(false);

const isOpen = ref(false);
const open = () => {
  isOpen.value = true;
};
const close = () => {
  isOpen.value = false;
};

defineExpose({
  open,
  close,
});

const state = reactive({
  name: profile.value?.name ?? "",
  email: profile.value?.email ?? "",
  currentPassword: "",
  newPassword: "",
});

const schema = z.object({
  name: z.string().nonempty("Invalid username"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

const saveProfile = async () => {
  if (!userData.value?.id) throw new Error("User not found");

  const payload: updateUserPayload = {
    newName: state.name?.trim() || undefined,
    newEmail: state.email?.trim() || undefined,
    currentPassword: undefined,
    newPassword: undefined,
  };

  await userStore.updateUser(userData.value.id, payload);
  isEditing.value = false;
};

const changePassword = async () => {
  if (!userData.value?.id) throw new Error("User not found");

  const payload: updateUserPayload = {
    newName: undefined,
    newEmail: undefined,
    currentPassword: state.currentPassword?.trim() || undefined,
    newPassword: state.newPassword?.trim() || undefined,
  };

  await userStore.updateUser(userData.value.id, payload);
  isEditing.value = false;
};

const resetState = () => {
  state.name = profile.value?.name ?? "";
  state.email = profile.value?.email ?? "";
  state.currentPassword = "";
  state.newPassword = "";
};

const cancelEdit = () => {
  resetState();
  isEditing.value = false;
};

onMounted(async () => {
  if (userData.value?.id) {
    await userStore.getUser(userData.value.id);
  }
});
</script>
