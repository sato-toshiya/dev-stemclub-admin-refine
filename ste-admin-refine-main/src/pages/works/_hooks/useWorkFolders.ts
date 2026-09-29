import { useMemo } from "react";
import type { Dayjs } from "dayjs";

import type { FolderItem } from "../_components/FolderGrid";
import type {
  AcademicYearRecord,
  ClassRecord,
  StudentRecord,
} from "@/common/types";
import { academicStatusJa } from "@/common/utils/academicYear";
import { dayNodeKey } from "@/common/utils";

type ClassDayRow = { day: string; count: number; dayjs: Dayjs };

export const useWorkFolders = ({
  selectedType,
  selectedYearDocId,
  selectedClassDocId,
  years,
  classes,
  students,
  classDayRows,
}: {
  selectedType: "year" | "class" | "student" | "day" | null;
  selectedYearDocId?: string;
  selectedClassDocId?: string;
  years: AcademicYearRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  classDayRows: ClassDayRow[];
}) => {
  const yearFolders = useMemo<FolderItem[]>(() => {
    return years.map((y) => ({
      key: `year:${y.documentId}`,
      title: y.name ?? "-",
      subtitle: y.academic_status
        ? `ステータス: ${academicStatusJa(y.academic_status)}`
        : undefined,
    }));
  }, [years]);

  const classFolders = useMemo<FolderItem[]>(() => {
    if (selectedType !== "year" || !selectedYearDocId) return [];
    return classes
      .filter((c) => c.academic_year?.documentId === selectedYearDocId)
      .map((c) => ({
        key: `class:${c.documentId}`,
        title: c.name ?? "-",
        subtitle: `生徒${c.studentsCount ?? 0}名／作品${c.projectsCount ?? 0}件`,
      }));
  }, [selectedType, selectedYearDocId, classes]);

  const studentFolders = useMemo<FolderItem[]>(() => {
    if (selectedType !== "class" || !selectedClassDocId) return [];

    const dayFolders: FolderItem[] = (classDayRows ?? []).map((r) => ({
      key: dayNodeKey(selectedClassDocId, r.day),
      title: `${r.dayjs.format("YYYY/MM/DD")}`,
      subtitle: `作品 ${r.count ?? 0}件`,
    }));

    const list: FolderItem[] = students
      .filter((s) => s.class?.documentId === selectedClassDocId)
      .map((s) => ({
        key: `student:${s.documentId}`,
        title: s.name ?? "-",
        subtitle: s.code ?? undefined,
      }));

    return [...dayFolders, ...list];
  }, [selectedType, selectedClassDocId, students, classDayRows]);

  return { yearFolders, classFolders, studentFolders };
};
