import { createApiClient } from "~/api/client";
import type {
  AuthResponse,
  User,
  authPayload,
  updateUserPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "~/types/users";

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
     * Refresh access + refresh tokens. Refresh token rotation is handled
     * automatically by the client on 401; this is only used directly for the
     * initial token exchange.
     */
    refresh(refreshToken: string): Promise<AuthResponse> {
      return apiClient<AuthResponse>("/users/refresh", {
        method: "POST",
        body: { refreshToken },
      });
    },

    /**
     * Logout user (revokes refresh token server-side)
     */
    logout(refreshToken: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>("/users/logout", {
        method: "POST",
        body: { refreshToken },
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
     * Request a password reset email
     */
    forgotPassword(
      payload: ForgotPasswordPayload,
    ): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>("/users/forgot-password", {
        method: "POST",
        body: payload,
      });
    },

    /**
     * Reset password using token from the reset email
     */
    resetPassword(
      payload: ResetPasswordPayload,
    ): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>("/users/reset-password", {
        method: "POST",
        body: payload,
      });
    },

    /**
     * Get user by ID
     */
    getUser(): Promise<User> {
      return apiClient<User>("/users/me", {
        method: "GET",
      });
    },

    /**
     * Update user
     */
    updateUser(payload: updateUserPayload): Promise<User> {
      return apiClient<User>("/users/me", {
        method: "PATCH",
        body: payload,
      });
    },

    /**
     * Delete user
     */
    deleteUser(email: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>("/users/me", {
        method: "DELETE",
        body: { userEmail: email },
      });
    },
  };
}
