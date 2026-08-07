<template>
  <div class="app-shell min-vh-100 flex flex-column">
    <AppHeader @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

    <AppMain />

    <AppSidebar v-model:open="isSidebarOpen" />

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "../stores/user";
import { navigateTo } from "#app";
import AppMain from "~/components/layout/AppMain.vue";
import AppHeader from "~/components/layout/AppHeader.vue";
import AppFooter from "~/components/layout/AppFooter.vue";
import AppSidebar from "~/components/layout/AppSidebar.vue";

const userStore = useUserStore();
if (!userStore.isAuthenticated) {
  await navigateTo("/login");
}

const isSidebarOpen = ref(false);
</script>
