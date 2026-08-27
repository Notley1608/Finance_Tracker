<template>
  <div class="rounded-xl border border-default p-5 bg-white dark:bg-gray-900">
    <div class="flex items-center gap-3">
      <UIcon
        :name="icon"
        :class="iconClasses"
        :style="{ backgroundColor: colour }"
      />
      <span class="text-sm text-muted">{{ label }}</span>
    </div>

    <p class="text-2xl font-bold text-highlighted tabular-nums">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  label: string;
  value: string;
  icon: string;
  colour?: string;
}>();

const iconClasses = computed(() =>
  props.colour === "primary"
    ? "w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-500 flex items-center justify-center"
    : "w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center",
);
</script>
