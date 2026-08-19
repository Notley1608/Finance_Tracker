import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useUserStore } from "~/stores/user";

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const userStore = useUserStore();

  if (!userStore.isAuthenticated) {
    return navigateTo("/login");
  }
});
