import { useRuntimeConfig, navigateTo } from "#imports";
import { useUserStore } from "~/stores/user";
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: any;
  query?: Record<string, any>;
}

export const createApiClient = () => {
  const config = useRuntimeConfig();

  const BASE_URL = config.public.apiBaseUrl;

  if (!BASE_URL) {
    throw new Error("API base URL is missing. Check NUXT_PUBLIC_API_BASE_URL");
  }

  return $fetch.create({
    baseURL: BASE_URL as string,

    onRequest({ options }) {
      if (!options.headers) {
        options.headers = new Headers();
      }

      const headers = options.headers as Headers;
      const userStore = useUserStore();

      if (userStore.token) {
        headers.set("Authorization", `Bearer ${userStore.token}`);
      }

      headers.set("Content-Type", "application/json");

      headers.set("Accept", "application/json");
    },

    async onResponseError({ response }) {
      if (response.status === 401) {
        const userStore = useUserStore();
        const expenseStore = useExpenseStore();
        const categoryStore = useCategoryStore();

        userStore.resetState();
        expenseStore.resetState();
        categoryStore.resetState();

        await navigateTo("/login");
      }
    },
  });
};
