<template>
  <div class="app-shell min-h-screen flex flex-col">
    <AppHeader
      :page-title="pageTitle"
      :sidebar-open="isSidebarOpen"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
    />

    <div
      class="flex-1 transition-all duration-300"
      :class="isSidebarOpen ? 'ml-64' : 'ml-0'"
    >
      <AppMain />

      <AppSidebar v-model:open="isSidebarOpen" />
    </div>
    <AppFooter />
  </div>
  <ProfileModal ref="profileModal" />
</template>

<script setup lang="ts">
import { computed, provide, ref } from "vue";
import { useRoute } from "#app";
import { formatTitle } from "~/utils";
import AppMain from "~/components/layout/AppMain.vue";
import AppHeader from "~/components/layout/AppHeader.vue";
import AppFooter from "~/components/layout/AppFooter.vue";
import AppSidebar from "~/components/layout/AppSidebar.vue";
import ProfileModal from "~/components/modals/ProfileModal.vue";

const route = useRoute();
const pageTitle = computed(() => {
  const title = route.meta.title as string | undefined;
  if (title) return title;

  const name = route.name?.toString();
  if (name) return formatTitle(name);

  return "Finance Tracker";
});

const profileModal = ref<InstanceType<typeof ProfileModal> | null>(null);
provide("profileModal", profileModal);

const isSidebarOpen = ref(false);
</script>
