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
          <UForm
            :state="passwordForm"
            @submit="changePassword"
            class="space-y-4"
          >
            <UFormField label="Password">
              <div v-if="!showPasswordForm" class="flex items-center">
                <UButton
                  variant="ghost"
                  size="sm"
                  @click="showPasswordForm = true"
                >
                  Change password
                </UButton>
              </div>

              <div v-else class="space-y-4">
                <UFormField label="Current password">
                  <UInput
                    v-model="passwordForm.currentPassword"
                    type="password"
                    autocomplete="current-password"
                  />
                </UFormField>

                <UFormField label="New password">
                  <UInput
                    v-model="passwordForm.newPassword"
                    type="password"
                    autocomplete="new-password"
                  />
                </UFormField>

                <UFormField label="Confirm new password">
                  <UInput
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                  />
                </UFormField>

                <div class="flex gap-2">
                  <UButton type="submit"> Update password </UButton>

                  <UButton variant="outline" @click="showPasswordForm = false">
                    Cancel
                  </UButton>
                </div>
              </div>
            </UFormField>
          </UForm>
        </section>

        <!-- Danger Zone -->
        <section class="bt b--black-10 pt5">
          <h3 class="f4 fw6 ma0 mb3">Danger Zone</h3>

          <div class="flex flex-column gap-3">
            <UButton icon="trash" variant="soft" @click="deleteUser">
              Delete account
            </UButton>

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
import type { updateUserPayload } from "~/types/users";
import { navigateTo } from "#app";

const userStore = useUserStore();
const toast = useToast();

const userData = computed(() => userStore.userData);
const profile = computed(() => userData.value);
const isEditing = ref(false);
const showPasswordForm = ref(false);

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
});

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
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
  try {
    await userStore.updateUser(userData.value.id, payload);
    isEditing.value = false;
  } catch (err) {
    console.error("Error updating user: ", err);
    toast.add({
      title: "Error",
      description: "Error updating user",
      color: "error",
    });
  } finally {
    toast.add({
      title: "Profile saved",
      description: "Profile successfully updated",
      color: "success",
    });
  }
};

const changePassword = async () => {
  if (!userData.value?.id) throw new Error("User not found");
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const payload: updateUserPayload = {
    newName: undefined,
    newEmail: undefined,
    currentPassword: passwordForm.currentPassword?.trim(),
    newPassword: passwordForm.newPassword?.trim(),
  };

  try {
    await userStore.updateUser(userData.value.id, payload);
    showPasswordForm.value = false;
  } catch (err) {
    console.error("Error updating password: ", err);
    toast.add({
      title: "Error",
      description: "Error updating password",
      color: "error",
    });
  } finally {
    toast.add({
      title: "Password changed",
      description: "Password successfully updated",
      color: "success",
    });
  }
};

const resetState = () => {
  state.name = profile.value?.name ?? "";
  state.email = profile.value?.email ?? "";
};

const cancelEdit = () => {
  resetState();
  isEditing.value = false;
};

const deleteUser = async () => {
  if (!userData.value?.id) throw new Error("User not found");

  const confirmed = window.confirm(
    "Are you sure you want to delete your account? This cannot be undone.",
  );
  if (!confirmed) return;

  try {
    await userStore.deleteUser(userData.value.id, profile.value?.email ?? "");
  } catch (err) {
    console.error("Error deleting user with : ", err);
    toast.add({
      title: "Error",
      description: "Error deleting account",
      color: "error",
    });
  } finally {
    close();
    toast.add({
      title: "User deleted",
      description: "Successfully deleted account",
      color: "success",
    });
    await navigateTo("/login");
  }
};

onMounted(async () => {
  if (userData.value?.id) {
    await userStore.getUser(userData.value.id);
  }
});
</script>
