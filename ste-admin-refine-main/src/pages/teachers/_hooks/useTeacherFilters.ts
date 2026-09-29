import type { CrudFilters } from "@refinedev/core";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

type SetFiltersFn = (
  filters: CrudFilters,
  behavior?: "merge" | "replace",
) => void;

export const useTeacherFilters = (setFilters: SetFiltersFn) => {
  const location = useLocation();

  const [q, setQ] = useState("");
  const [classDocId, setClassDocId] = useState<string | undefined>(undefined);
  const [academicYearDocId, setAcademicYearDocId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);

    let nextQ = "";
    let nextClass: string | undefined = undefined;
    let nextAcademicYear: string | undefined = undefined;

    for (const [k, v] of sp.entries()) {
      const mField = k.match(/^filters\[(\d+)\]\[field\]$/);
      if (mField && v === "classes.documentId") {
        const idx = mField[1];
        nextClass = sp.get(`filters[${idx}][value]`) ?? undefined;
      }
      if (mField && v === "classes.academic_year.documentId") {
        const idx = mField[1];
        nextAcademicYear = sp.get(`filters[${idx}][value]`) ?? undefined;
      }

      const mOp = k.match(/^filters\[(\d+)\]\[operator\]$/);
      if (mOp && v === "or") {
        const idx = mOp[1];
        nextQ =
          sp.get(`filters[${idx}][value][0][value]`) ||
          sp.get(`filters[${idx}][value][1][value]`) ||
          sp.get(`filters[${idx}][value][2][value]`) ||
          "";
      }
    }

    if (!nextClass && sp.has("class")) {
      nextClass = sp.get("class") ?? undefined;
    }
    if (!nextAcademicYear && sp.has("academicYear")) {
      nextAcademicYear = sp.get("academicYear") ?? undefined;
    }

    setQ(nextQ);
    setClassDocId(nextClass);
    setAcademicYearDocId(nextAcademicYear);
  }, [location.search]);

  const buildFilters = useCallback(
    (
      nextQ: string,
      nextClassDocId?: string,
      nextAcademicYearDocId?: string,
      blocked?: boolean,
    ) => {
      const filters: CrudFilters = [];

      const keyword = nextQ.trim();
      if (keyword) {
        filters.push({
          operator: "or",
          value: [
            { field: "name", operator: "contains", value: keyword },
            {
              field: "users_permissions_user.email",
              operator: "contains",
              value: keyword,
            },
            {
              field: "users_permissions_user.phone",
              operator: "contains",
              value: keyword,
            },
          ],
        });
      }

      if (nextClassDocId) {
        filters.push({
          field: "classes.documentId",
          operator: "eq",
          value: nextClassDocId,
        });
      }
      if (nextAcademicYearDocId) {
        filters.push({
          field: "classes.academic_year.documentId",
          operator: "eq",
          value: nextAcademicYearDocId,
        });
      }

      if (typeof blocked === "boolean") {
        filters.push({
          field: "users_permissions_user.blocked",
          operator: "eq",
          value: blocked,
        });
      }

      return filters;
    },
    [],
  );

  const applyFilters = useCallback(
    (
      nextQ: string,
      nextClassDocId?: string,
      nextAcademicYearDocId?: string,
      blocked?: boolean,
    ) => {
      setFilters(
        buildFilters(nextQ, nextClassDocId, nextAcademicYearDocId, blocked),
        "replace",
      );
    },
    [setFilters, buildFilters],
  );

  const resetFilters = useCallback(() => {
    setQ("");
    setClassDocId(undefined);
    setAcademicYearDocId(undefined);
    setFilters([], "replace");
  }, [setFilters]);

  return {
    q,
    setQ,
    classDocId,
    setClassDocId,
    academicYearDocId,
    setAcademicYearDocId,
    applyFilters,
    resetFilters,
  };
};
