import { useRuntimeConfig, navigateTo } from "#imports";

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

      if (import.meta.client) {
        const token = localStorage.getItem("auth_token");

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      headers.set("Content-Type", "application/json");

      headers.set("Accept", "application/json");
    },

    async onResponseError({ response }) {
      if (response.status === 401) {
        if (import.meta.client) {
          localStorage.removeItem("auth_token");

          await navigateTo("/login");
        }
      }
    },
  });
};
