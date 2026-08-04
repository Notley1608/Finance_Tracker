import { useRuntimeConfig } from "#imports";
import { navigateTo } from "#app";

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: any;
  query?: Record<string, any>;
}

export const createApiClient = () => {
  const config = useRuntimeConfig();
  const BASE_URL = config.public.apiBaseUrl;

  return $fetch.create({
    baseURL: BASE_URL as string,

    onRequest({ options }) {
      if (!options.headers) options.headers = new Headers();
      const headers = options.headers as Headers;

      const token = localStorage.getItem("auth_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
    },

    onResponseError({ response }) {
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        navigateTo("/login");
      }
    },
  });
};

export const apiClient = createApiClient();
