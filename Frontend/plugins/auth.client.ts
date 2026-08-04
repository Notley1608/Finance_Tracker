import { defineNuxtPlugin } from "#app";
import { useUserStore } from "../app/stores/user";

export default defineNuxtPlugin(() => {
  const userStore = useUserStore();

  // Client-only lifecycle hook
  userStore.initialiseAuth().catch((e: any) => {
    // handle potential errors here if needed
    console.error("Auth initialization error:", e);
  });
});
