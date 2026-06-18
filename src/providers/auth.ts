import type { AuthProvider, HttpError } from "@refinedev/core";

import type { components } from "@/types/api";
import { apiFetch, clearToken, getToken, setToken } from "./http";

type AuthResponse = components["schemas"]["AuthResponseDto"];
type AuthUser = components["schemas"]["UserResponseDto"];

/**
 * Real backend auth over the shared {@link apiFetch} client (which injects the
 * Bearer token and normalises errors). The issued JWT is stored under
 * `TOKEN_KEY`; every protected request then carries it automatically.
 */
export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { accessToken } = await apiFetch<AuthResponse>("auth/login", {
        method: "POST",
        json: { email, password },
      });
      // Defensive: a 2xx without a token must never count as a login.
      if (!accessToken) throw new Error("missing access token");
      setToken(accessToken);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message:
            (error as HttpError)?.message ?? "بيانات الدخول غير صحيحة",
        },
      };
    }
  },

  register: async ({ name, email, password }) => {
    try {
      const { accessToken } = await apiFetch<AuthResponse>("auth/register", {
        method: "POST",
        json: { name, email, password },
      });
      if (!accessToken) throw new Error("missing access token");
      setToken(accessToken);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "RegisterError",
          message:
            (error as HttpError)?.message ??
            "تعذّر إنشاء الحساب — تحقّق من البيانات",
        },
      };
    }
  },

  logout: async () => {
    clearToken();
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    if (getToken()) return { authenticated: true };
    return { authenticated: false, redirectTo: "/login" };
  },

  getPermissions: async () => null,

  getIdentity: async () => {
    try {
      const user = await apiFetch<AuthUser>("auth/me");
      return {
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        role: user.role,
      };
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    // Any 401 (expired/invalid token) clears auth and bounces to login.
    if ((error as HttpError)?.statusCode === 401) {
      return { logout: true, redirectTo: "/login", error };
    }
    return { error };
  },
};
