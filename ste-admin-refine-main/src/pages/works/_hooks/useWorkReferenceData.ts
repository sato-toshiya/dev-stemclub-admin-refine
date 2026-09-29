import { AcademicYearRecord, ClassRecord, StudentRecord } from "@/common/types";
import { useList } from "@refinedev/core";
import { useCallback, useMemo } from "react";

export const useWorkReferenceData = () => {
  const { query: yearsQuery, result: yearsRes } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { mode: "off" },
    meta: { fields: ["name", "academic_status", "documentId"] },
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const { query: classesQuery, result: classesRes } = useList<ClassRecord>({
    resource: "classes",
    pagination: { mode: "off" },
    meta: {
      fields: ["name", "documentId"],
      populate: { academic_year: { fields: ["documentId", "name"] } },
    },
    sorters: [{ field: "name", order: "asc" }],
  });

  const { query: studentsQuery, result: studentsRes } = useList<StudentRecord>({
    resource: "students",
    pagination: { mode: "off" },
    meta: {
      fields: ["name", "documentId"],
      populate: { class: { fields: ["documentId", "name"] } },
    },
    sorters: [{ field: "name", order: "asc" }],
  });

  const years = useMemo(() => yearsRes.data ?? [], [yearsRes.data]);
  const classes = useMemo(() => classesRes.data ?? [], [classesRes.data]);
  const students = useMemo(() => studentsRes.data ?? [], [studentsRes.data]);

  const loading =
    !!yearsQuery.isFetching ||
    !!classesQuery.isFetching ||
    !!studentsQuery.isFetching;

  const refetchAll = useCallback(() => {
    yearsQuery.refetch();
    classesQuery.refetch();
    studentsQuery.refetch();
  }, [yearsQuery, classesQuery, studentsQuery]);

  return { years, classes, students, refetchAll, loading };
};
