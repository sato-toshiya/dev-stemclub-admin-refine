import { Identity } from "./authStateContext";

let role: string | null = null;
let identity: Identity | null = null;
let ready = false;

export const setAuthSnapshot = (next: {
  role: string | null;
  identity: Identity | null;
  ready: boolean;
}) => {
  role = next.role;
  identity = next.identity;
  ready = next.ready;
};

export const getRoleSnapshot = () => role;
export const getIdentitySnapshot = () => identity;
export const getReadySnapshot = () => ready;

export const clearAuthSnapshot = () => {
  role = null;
  identity = null;
  ready = false;
};
