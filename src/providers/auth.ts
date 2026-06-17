import type { AuthProvider } from "@refinedev/core";

import { TOKEN_KEY } from "./constants";
import { kyInstance } from "./data";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

/**
 * Real backend auth — replaces the previous localStorage mock. Talks to the
 * NestJS admin API through the shared `kyInstance` (base URL from `API_URL`) and
 * stores the issued JWT under `TOKEN_KEY`. `authClient` attaches that token as a
 * `Bearer` header so protected calls (e.g. GET /auth/me) are authenticated.
 */
const authClient = kyInstance.extend({
  // The shared kyInstance is built by @refinedev/rest with `throwHttpErrors:
  // false` (its data provider handles HTTP errors itself). For auth we MUST
  // re-enable throwing, otherwise a 401/409 response is read as a success and a
  // failed login still "authenticates". Override it here.
  throwHttpErrors: true,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

/** ky throws an HTTPError carrying the Response; surface the API error message. */
const getErrorResponse = (error: unknown): Response | undefined => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: unknown }).response;
    if (response instanceof Response) return response;
  }
  return undefined;
};

const readErrorMessage = async (
  error: unknown,
  fallback: string,
): Promise<string> => {
  const response = getErrorResponse(error);
  if (!response) return fallback;
  try {
    const body = (await response.clone().json()) as {
      error?: { message?: string };
      message?: string;
    };
    return body.error?.message ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { accessToken } = await authClient
        .post("auth/login", { json: { email, password } })
        .json<AuthResponse>();
      // Defensive: a 2xx without a token must never count as a login.
      if (!accessToken) {
        throw new Error("Login response did not include an access token");
      }
      localStorage.setItem(TOKEN_KEY, accessToken);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: await readErrorMessage(error, "بيانات الدخول غير صحيحة"),
        },
      };
    }
  },

  register: async ({ name, email, password }) => {
    try {
      const { accessToken } = await authClient
        .post("auth/register", { json: { name, email, password } })
        .json<AuthResponse>();
      // Defensive: a 2xx without a token must never count as a registration.
      if (!accessToken) {
        throw new Error("Register response did not include an access token");
      }
      localStorage.setItem(TOKEN_KEY, accessToken);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "RegisterError",
          message: await readErrorMessage(
            error,
            "تعذّر إنشاء الحساب — تحقّق من البيانات",
          ),
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: "/login" };
  },

  getPermissions: async () => null,

  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const user = await authClient.get("auth/me").json<AuthUser>();
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
    if (getErrorResponse(error)?.status === 401) {
      return { logout: true, redirectTo: "/login", error };
    }
    return { error };
  },
};
