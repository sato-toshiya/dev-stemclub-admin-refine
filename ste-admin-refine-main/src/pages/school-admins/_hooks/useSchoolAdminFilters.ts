import type { CrudFilters } from "@refinedev/core";
import { useCallback, useState } from "react";

export type StatusFilter = "all" | "active" | "inactive";

export const useSchoolAdminFilters = (
  setFilters: (filters: CrudFilters, behavior?: "merge" | "replace") => void,
) => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const applyFilters = useCallback(
    (nextQ: string, nextStatus: StatusFilter) => {
      const filters: CrudFilters = [];

      const keyword = nextQ.trim();
      if (keyword) {
        filters.push({
          operator: "or",
          value: [
            { field: "name", operator: "contains", value: keyword },
            { field: "representor", operator: "contains", value: keyword },
            {
              field: "users_permissions_users.email",
              operator: "contains",
              value: keyword,
            },
          ],
        });
      }

      if (nextStatus !== "all") {
        filters.push({
          field: "users_permissions_users.blocked",
          operator: "eq",
          value: nextStatus === "inactive",
        });
      }

      setFilters(filters, "replace");
    },
    [setFilters],
  );

  const resetFilters = useCallback(() => {
    setQ("");
    setStatus("all");
    setFilters([], "replace");
  }, [setFilters]);

  return {
    q,
    setQ,
    status,
    setStatus,
    applyFilters,
    resetFilters,
  };
};
