import type {
  User,
  authPayload,
  updateUserPayload,
  AuthResponse,
} from "~/types/users";

import { createApiClient } from "~/api/client";

export function useUsersApi() {
  const apiClient = createApiClient();

  return {
    /**
     * Login user
     */
    login(payload: authPayload): Promise<AuthResponse> {
      return apiClient<AuthResponse>("/users/login", {
        method: "POST",
        body: payload,
      });
    },

    /**
     * Logout user
     */
    logout(): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>("/users/logout", {
        method: "POST",
      });
    },

    /**
     * Register new user
     */
    register(payload: authPayload): Promise<AuthResponse> {
      return apiClient<AuthResponse>("/users/register", {
        method: "POST",
        body: payload,
      });
    },

    /**
     * Get user by ID
     */
    getUser(userId: string): Promise<User> {
      return apiClient<User>(`/users/${userId}`, {
        method: "GET",
      });
    },

    /**
     * Update user
     */
    updateUser(userId: string, payload: updateUserPayload): Promise<User> {
      return apiClient<User>(`/users/${userId}`, {
        method: "PATCH",
        body: payload,
      });
    },

    /**
     * Delete user
     */
    deleteUser(userId: string, email: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/users/${userId}`, {
        method: "DELETE",
        body: { userEmail: email },
      });
    },
  };
}
