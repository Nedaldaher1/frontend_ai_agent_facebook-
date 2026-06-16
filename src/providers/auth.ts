import type { AuthProvider } from "@refinedev/core";
import { TOKEN_KEY } from "./constants";

export const authProvider: AuthProvider = {
  login: async ({ username, email, password }) => {
    if ((username || email) && password) {
      localStorage.setItem(TOKEN_KEY, username ?? email);
      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: {
        name: "LoginError",
        message: "بيانات الدخول غير صحيحة",
      },
    };
  },
  // Mock registration — stores a session token like login does.
  // Replace with a real backend call when auth is wired (CLAUDE.md §2).
  register: async ({ name, email, password }) => {
    if (email && password) {
      localStorage.setItem(TOKEN_KEY, name ?? email);
      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: {
        name: "RegisterError",
        message: "تعذّر إنشاء الحساب — تحقّق من البيانات",
      },
    };
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return {
        id: 1,
        name: "John Doe",
        avatar: "https://i.pravatar.cc/300",
      };
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
