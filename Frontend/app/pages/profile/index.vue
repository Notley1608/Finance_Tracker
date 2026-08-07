<template>
  <div class="flex flex-col h-screen">
    <h3>General</h3>
    <span>{{ profile?.name }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "~/stores/user";

definePageMeta({
  title: "Profile",
});

const userStore = useUserStore();
const userData = computed(() => userStore.userData);

const profile = computed(async () => {
  if (!userData.value?.id) return null;
  return await userStore.getUser(userData.value.id);
});
</script>
