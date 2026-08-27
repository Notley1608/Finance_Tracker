<template>
  <header class="w-full py-6 border-b border-default mb-8">
    <div class="flex items-center justify-between w-full gap-4">
      <h1
        class="text-3xl font-bold text-highlighted tracking-tight sm:text-4xl"
      >
        {{ title }}
      </h1>

      <time
        v-if="date"
        class="text-sm text-muted font-medium tracking-wide uppercase shrink-0"
      >
        {{ date }}
      </time>
    </div>

    <p v-if="description" class="mt-3 text-lg text-muted leading-relaxed">
      {{ description }}
    </p>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  date?: string;
}>();
</script>
