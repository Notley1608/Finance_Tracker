<template>
  <UDrawer v-model:open="open" direction="left">
    <template #content>
      <div class="p-4 w-64">
        <UNavigationMenu orientation="vertical" :items="items" />
      </div>
    </template>
  </UDrawer>
</template>

<script lang="ts" setup>
import { watch } from "vue";
import { useRoute } from "#app";

const open = defineModel<boolean>("open");
const route = useRoute();
const items = [
  {
    label: "Dashboard",
    icon: "i-heroicons-home",
    to: "/dashboard",
  },
  {
    label: "Expenses",
    icon: "i-heroicons-currency-dollar",
    to: "/expenses",
  },
  {
    label: "Categories",
    icon: "i-heroicons-tag",
    to: "/categories",
  },
];

watch(
  () => route.path,
  () => {
    open.value = false;
  },
);
</script>
