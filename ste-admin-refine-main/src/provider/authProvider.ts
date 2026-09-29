import type { AuthProvider } from "@refinedev/core";
import { AuthHelper } from "@refinedev/strapi-v4";
import axios from "axios";

import {
  clearAuthSnapshot,
  getIdentitySnapshot,
  getRoleSnapshot,
} from "./authStateBridge";
import { API_URL_WITH_API } from "@/config/api";
import {
  ROLE_KEY,
  SCHOOL_ADMIN_ID_KEY,
  TOKEN_KEY,
} from "@/constants/storageKeys";

export const axiosInstance = axios.create({
  baseURL: API_URL_WITH_API,
});

const strapiAuthHelper = AuthHelper(API_URL_WITH_API);

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, status } = await strapiAuthHelper.login(email, password);

    if (status === 200 && data?.jwt) {
      const jwt: string = data.jwt;
      localStorage.setItem(TOKEN_KEY, jwt);
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${jwt}`;

      window.location.replace("/");

      return { success: true };
    }

    return {
      success: false,
      error: { message: "Login failed", name: "Invalid email or password" },
    };
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(SCHOOL_ADMIN_ID_KEY);

    clearAuthSnapshot();
    delete axiosInstance.defaults.headers.common.Authorization;

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/login");
    }
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      return { authenticated: true };
    }
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
      error: { message: "Check failed", name: "Token not found" },
    };
  },

  getPermissions: async () => {
    return getRoleSnapshot();
  },

  getIdentity: async () => {
    const raw = getIdentitySnapshot();
    if (!raw) return null;

    return {
      id: raw.id,
      name: raw.username,
      email: raw.email,
      role: raw.role?.type,
      school_admin_documentId: raw.school_admin?.documentId,
    };
  },

  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
