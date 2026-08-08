<template>
  <header class="bb b--black-10 pa3 flex items-center">
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

    <div class="ma3 absolute right-0">
      <UButton
        icon="i-heroicons-cog-6-tooth"
        variant="soft"
        @click="openModal"
      />
    </div>
  </header>
</template>

<script lang="ts" setup>
import { inject } from "vue";
import type { Ref } from "vue";
import ProfileModal from "~/components/modals/ProfileModal.vue";

const profileModal =
  inject<Ref<InstanceType<typeof ProfileModal> | null>>("profileModal");

const openModal = () => {
  profileModal?.value?.open();
};
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
