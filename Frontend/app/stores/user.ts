import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  User,
  authPayload,
  updateUserPayload,
} from "~/types/users";
import { useUsersApi } from "~/api/modules/users";

export const useUserStore = defineStore(
  "user",
  () => {
    const usersApi = useUsersApi();

    /**
     * Needs to handle:
     * login/logout
     * user profile info
     * auth tokens
     * loading/error/success states
     */
    const userData = ref<User | null>(null);
    const token = ref<string | null>(null);
    const isLoading = ref(false);
    const error = ref(null);

    const isAuthenticated = computed<boolean>(() => !!token.value);

    function setToken(newToken: string | null) {
      token.value = newToken;
      if (typeof localStorage !== "undefined") {
        if (newToken) localStorage.setItem("auth_token", newToken);
        else localStorage.removeItem("auth_token");
      }
    }

    function resetState(): void {
      userData.value = null;
      setToken(null);
      error.value = null;
    }

    async function login(payload: authPayload): Promise<User | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await usersApi.login(payload);
        if (!response || !response.token) {
          throw new Error("Invalid credentials");
        }
        setToken(response.token);
        userData.value = response.user || null;
        return userData.value;
      } catch (err: any) {
        error.value = err.message || "Error logging into account";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function logout(): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        await usersApi.logout();
      } catch (err: any) {
        error.value = err.message || "Error logging out";
        throw err;
      } finally {
        resetState();
        isLoading.value = false;
      }
    }

    async function register(payload: authPayload): Promise<User | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await usersApi.register(payload);
        if (!response || !response.token) {
          throw new Error("Invalid credentials");
        }
        setToken(response.token);
        userData.value = response.user || null;
        return userData.value;
      } catch (err: any) {
        error.value = err.message || "Error registering account";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function getUser(userId: string): Promise<User | null> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await usersApi.getUser(userId);
        if (!response) {
          throw new Error("Invalid credentials");
        }
        userData.value = response || null;
        return userData.value;
      } catch (err: any) {
        error.value = err.message || "Error getting user";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function updateUser(
      userId: string,
      payload: updateUserPayload,
    ): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await usersApi.updateUser(userId, payload);
        if (!response) {
          throw new Error("Invalid credential");
        }
        userData.value = response || null;
      } catch (err: any) {
        error.value = err.message || "Error updating user";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function deleteUser(
      userId: string,
      payload: authPayload,
    ): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        await usersApi.deleteUser(userId, payload);
      } catch (err: any) {
        error.value = err.message || "Error deleting user";
        throw err;
      } finally {
        resetState();
        isLoading.value = false;
      }
    }

    return {
      userData,
      token,
      isLoading,
      error,
      isAuthenticated,
      login,
      logout,
      register,
      getUser,
      updateUser,
      deleteUser,
    };
  },
  {
    persist: {
      paths: ["userData"],
    },
  } as any,
);
