import type { CrudFilters } from "@refinedev/core";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

type SetFiltersFn = (
  filters: CrudFilters,
  behavior?: "merge" | "replace",
) => void;

export const useStudentFilters = (setFilters: SetFiltersFn) => {
  const location = useLocation();

  const [q, setQ] = useState("");
  const [classDocId, setClassDocId] = useState<string | undefined>(undefined);
  const [academicYearDocId, setAcademicYearDocId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);

    const keyword =
      sp.get("filters[0][value][0][value]") ||
      sp.get("filters[0][value][1][value]") ||
      "";

    setQ(keyword);

    let nextClass: string | undefined = undefined;
    let nextAcademicYear: string | undefined = undefined;

    for (const [k, v] of sp.entries()) {
      const m = k.match(/^filters\[(\d+)\]\[field\]$/);
      if (m && v === "class.documentId") {
        const idx = m[1];
        nextClass = sp.get(`filters[${idx}][value]`) ?? undefined;
      }
      if (m && v === "class.academic_year.documentId") {
        const idx = m[1];
        nextAcademicYear = sp.get(`filters[${idx}][value]`) ?? undefined;
      }
    }

    if (!nextClass && sp.has("class")) nextClass = sp.get("class") ?? undefined;
    if (!nextAcademicYear && sp.has("academicYear")) {
      nextAcademicYear = sp.get("academicYear") ?? undefined;
    }

    setClassDocId(nextClass);
    setAcademicYearDocId(nextAcademicYear);
  }, [location.search]);

  const applyFilters = useCallback(
    (nextQ: string, nextClassDocId?: string, nextAcademicYearDocId?: string) => {
      const filters: CrudFilters = [];

      const keyword = nextQ.trim();
      if (keyword) {
        filters.push({
          operator: "or",
          value: [
            { field: "name", operator: "contains", value: keyword },
            { field: "name_kana", operator: "contains", value: keyword },
          ],
        });
      }

      if (nextClassDocId) {
        filters.push({
          field: "class.documentId",
          operator: "eq",
          value: nextClassDocId,
        });
      }
      if (nextAcademicYearDocId) {
        filters.push({
          field: "class.academic_year.documentId",
          operator: "eq",
          value: nextAcademicYearDocId,
        });
      }

      setFilters(filters, "replace");
    },
    [setFilters],
  );

  return {
    q,
    setQ,
    classDocId,
    setClassDocId,
    academicYearDocId,
    setAcademicYearDocId,
    applyFilters,
  };
};
