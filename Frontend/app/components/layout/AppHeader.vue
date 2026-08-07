<template>
  <header class="bb b--black-10 pa3 flex items-center overflow-hidden">
    <UButton
      icon="i-heroicons-bars-4"
      variant="ghost"
      @click="emit('toggle-sidebar')"
    />

    <div
      class="ml-3 transition-transform duration-300 ease-out"
      :class="props.sidebarOpen ? 'translate-x-64' : 'translate-x-0'"
    >
      <h1 class="ma0">{{ props.pageTitle }}</h1>
    </div>
  </header>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: "toggle-sidebar"): void;
}>();

const props = defineProps({
  pageTitle: {
    type: String,
    required: true,
  },
  sidebarOpen: {
    type: Boolean,
    required: true,
  },
});
</script>
