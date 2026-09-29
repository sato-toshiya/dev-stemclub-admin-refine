import { EXP_KEY, LS_EXP, TreeKey } from "@/common/types";
import { decodeExpanded, encodeExpanded, setQueryParam } from "@/common/utils";
import { useCallback, useEffect, useState } from "react";

export const usePersistedExpandedKeys = () => {
  const [expandedKeys, setExpandedKeys] = useState<TreeKey[]>([]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const expFromUrl = decodeExpanded(sp.get(EXP_KEY));

    if (expFromUrl.length) {
      setExpandedKeys(expFromUrl);
      return;
    }

    const expFromLs = localStorage.getItem(LS_EXP);
    if (expFromLs) {
      try {
        const parsed = JSON.parse(expFromLs);
        if (Array.isArray(parsed)) setExpandedKeys(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_EXP, JSON.stringify(expandedKeys));
  }, [expandedKeys]);

  const onExpand = useCallback((keys: React.Key[]) => {
    const next = keys as string[];
    setExpandedKeys(next);

    setQueryParam(EXP_KEY, next.length ? encodeExpanded(next) : undefined);
  }, []);

  return { expandedKeys, setExpandedKeys, onExpand };
};
