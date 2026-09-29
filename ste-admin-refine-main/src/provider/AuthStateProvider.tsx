import React, { useCallback, useEffect, useMemo, useState } from "react";
import { axiosInstance } from "./authProvider";
import { clearAuthSnapshot, setAuthSnapshot } from "./authStateBridge";
import { AuthStateCtx, type Identity } from "./authStateContext";
import { TOKEN_KEY } from "@/constants/storageKeys";

export const AuthStateProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(() => {
    setIdentity(null);
    setRole(null);
    clearAuthSnapshot();
    setReady(true);
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clear();
      return;
    }

    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;

    const { data } = await axiosInstance.get<Identity>("/users/me", {
      params: { populate: ["role", "school_admin"] },
    });

    const me = data;
    const nextRole = me.role?.type ?? null;

    setIdentity(me);
    setRole(nextRole);
    setAuthSnapshot({ role: nextRole, identity: me, ready: true });
    setReady(true);
  }, [clear]);

  useEffect(() => {
    refreshMe().catch(() => clear());
  }, [refreshMe, clear]);

  const value = useMemo(
    () => ({ identity, role, ready, refreshMe, clear }),
    [identity, role, ready, refreshMe, clear],
  );

  return (
    <AuthStateCtx.Provider value={value}>{children}</AuthStateCtx.Provider>
  );
};
