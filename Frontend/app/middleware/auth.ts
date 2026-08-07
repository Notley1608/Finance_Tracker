import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useUserStore } from "~/stores/user";

export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore();

  if (!userStore.isAuthenticated) {
    return navigateTo("/login");
  }
});
