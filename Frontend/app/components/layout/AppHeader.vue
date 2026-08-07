<template>
  <header class="bb b--black-10 pa3 flex items-center justify-between">
    <UButton
      icon="i-lucide-menu"
      variant="ghost"
      @click="emit('toggle-sidebar')"
    />
  </header>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: "toggle-sidebar"): void;
}>();
</script>
