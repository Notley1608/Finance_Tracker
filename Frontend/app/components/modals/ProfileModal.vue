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

          <p class="ma0 mb4 gray">
            Manage your profile and account preferences.
          </p>

          <p>{{ profile?.name }}</p>
          <p>{{ profile?.email }}</p>
          <!-- Your general settings go here -->
        </section>

        <!-- Security -->
        <section class="bt b--black-10 pt5 mb5">
          <h3 class="f4 fw6 ma0 mb3">Security</h3>

          <UButton
            icon="arrow-right-circle"
            variant="soft"
            @click="updateUserProfile"
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
import { computed, ref } from "vue";
import { useUserStore } from "~/stores/user";
import type { updateUserPayload, User } from "~/types/users";

const userStore = useUserStore();
const userData = computed(() => userStore.userData);
const profile = computed(() => userData.value);

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

const updateUserProfile = async (
  payload: updateUserPayload,
): Promise<User | null> => {
  if (!userData.value?.id) {
    throw new Error("User not found");
  }
  await userStore.updateUser(userData.value.id, payload);
  return userStore.userData;
};

// onMounted(async () => {
//   if (userData.value?.id) {
//     await userStore.getUser(userData.value.id);
//   }
// });
</script>
