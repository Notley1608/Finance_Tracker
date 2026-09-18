import { $fetch, type FetchOptions } from "ofetch";
import { useRuntimeConfig } from "#imports";
import { useUserStore } from "~/stores/user";
import { useExpenseStore } from "~/stores/expense";
import { useCategoryStore } from "~/stores/category";

export interface ApiClientOptions extends Omit<FetchOptions, "body"> {
  body?: unknown;
  query?: Record<string, unknown>;
}

/** Backwards-compatible alias so callers can import `ApiClientRequest`. */
export type ApiClientRequest = ApiClientOptions;

export type ApiClient = <T>(
  url: string,
  options?: ApiClientOptions,
) => Promise<T>;

/**
 * Auth-related endpoints must never trigger the refresh-token retry loop;
 * otherwise a bad login would silently rotate tokens on the wrong account.
 */
const NO_AUTO_REFRESH_PATHS = new Set([
  "/users/login",
  "/users/register",
  "/users/refresh",
  "/users/logout",
  "/users/forgot-password",
  "/users/reset-password",
]);

/**
 * Single-flight in-flight refresh so that a burst of 401 responses triggers
 * exactly one token exchange instead of N.
 */
let refreshInFlight: Promise<string | null> | null = null;

function getBaseUrl(): string {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBaseUrl as string;

  if (!baseURL) {
    throw new Error("API base URL is missing. Check NUXT_PUBLIC_API_BASE_URL");
  }

  return baseURL;
}

function hardReset() {
  const userStore = useUserStore();
  const expenseStore = useExpenseStore();
  const categoryStore = useCategoryStore();

  userStore.resetState();
  expenseStore.resetState();
  categoryStore.resetState();

  if (import.meta.client) {
    void navigateTo("/login");
  }
}

async function performRefresh(baseURL: string): Promise<string | null> {
  const userStore = useUserStore();

  if (!userStore.refreshToken) {
    hardReset();
    return null;
  }

  try {
    const response = await $fetch<{
      accessToken: string;
      refreshToken: string;
    }>("/users/refresh", {
      baseURL,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: { refreshToken: userStore.refreshToken },
    });

    userStore.setTokens(response.accessToken, response.refreshToken);
    return response.accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    hardReset();
    return null;
  }
}

function refreshAccessToken(baseURL: string): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(baseURL).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function createApiClient(): ApiClient {
  const baseURL = getBaseUrl();

  return async function apiClient<T>(
    url: string,
    options: ApiClientOptions = {},
  ): Promise<T> {
    const userStore = useUserStore();
    const { body, query, headers = {}, ...rest } = options;

    const doRequest = async (
      accessToken: string | null,
      isRetry: boolean,
    ): Promise<T> => {
      const nextHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(headers as Record<string, string>),
      };

      if (accessToken) {
        nextHeaders.Authorization = `Bearer ${accessToken}`;
      }

      try {
        return await $fetch<T>(url, {
          ...rest,
          baseURL,
          responseType: "json" as const,
          body: body as Record<string, unknown> | BodyInit | null | undefined,
          query,
          headers: nextHeaders,
        });
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        const isAuthEndpoint = NO_AUTO_REFRESH_PATHS.has(url);

        if (statusCode === 401 && !isRetry && !isAuthEndpoint) {
          const newAccessToken = await refreshAccessToken(baseURL);
          if (newAccessToken) {
            return doRequest(newAccessToken, true);
          }
        }

        throw error;
      }
    };

    return doRequest(userStore.token, false);
  };
}
