import type {
  User,
  authPayload,
  updateUserPayload,
  AuthResponse,
} from "~/types/users";
import { apiClient } from "../client";

export const usersApi = {
  /**
   * METHODS:
   * login
   * logout
   * register
   * getUserById
   * updateUserById
   * deleteUserById
   */
  login(payload: authPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/users/login", {
      method: "POST",
      body: payload,
    });
  },
  logout(): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>("/users/logout", {
      method: "POST",
    });
  },
  register(payload: authPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/users/register", {
      method: "POST",
      body: payload,
    });
  },
  getUser(userId: string): Promise<User> {
    return apiClient<User>(`/users/${userId}`, {
      method: "GET",
    });
  },
  updateUser(userId: string, payload: updateUserPayload): Promise<User> {
    return apiClient<User>(`users/${userId}`, {
      method: "PATCH",
      body: payload,
    });
  },
  deleteUser(userId: string, payload: authPayload): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`users/${userId}`, {
        method: "DELETE",
        body: payload
    })
  }
};
