import { createContext, useContext } from "react";

export type Identity = {
  id: number;
  username: string;
  email: string;
  role?: { type?: string };
  school_admin?: { documentId?: string; name?: string };
};

export type AuthState = {
  identity: Identity | null;
  role: string | null;
  ready: boolean;
  refreshMe: () => Promise<void>;
  clear: () => void;
};

export const AuthStateCtx = createContext<AuthState | null>(null);

export const useAuthState = () => {
  const v = useContext(AuthStateCtx);
  if (!v) throw new Error("useAuthState must be used within AuthStateProvider");
  return v;
};
