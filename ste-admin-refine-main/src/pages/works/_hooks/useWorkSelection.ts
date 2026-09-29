import { useEffect, useMemo } from "react";
import {
  AcademicYearRecord,
  ClassRecord,
  StudentRecord,
  TreeKey,
} from "@/common/types";
import { fmtBreadcrumb, nodeKey, parseNodeKey } from "@/common/utils";

type Names = {
  year?: string;
  klass?: string;
  student?: string;
  breadcrumb: string;
};

type SelectedType = "year" | "class" | "student" | "day" | null;

export const useWorkSelection = ({
  selectedNodeKey,
  years,
  classes,
  students,
  setExpandedKeys,
  autoExpand = false,
}: {
  selectedNodeKey: string | null;
  years: AcademicYearRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  setExpandedKeys: React.Dispatch<React.SetStateAction<TreeKey[]>>;
  autoExpand?: boolean;
}) => {
  const { type, docId } = useMemo(() => {
    if (!selectedNodeKey) return { type: null as SelectedType, docId: "" };
    const p = parseNodeKey(selectedNodeKey);
    return { type: p.type as SelectedType, docId: p.docId };
  }, [selectedNodeKey]);

  const selectedStudentDocId = useMemo(() => {
    return type === "student" && docId ? docId : undefined;
  }, [type, docId]);

  const selectedClassDocId = useMemo(() => {
    if (!type || !docId) return undefined;

    if (type === "class" || type === "day") return docId;

    if (type === "student") {
      const s = students.find((x) => x.documentId === docId);
      return s?.class?.documentId;
    }

    return undefined;
  }, [type, docId, students]);

  const selectedYearDocId = useMemo(() => {
    if (!type || !docId) return undefined;

    if (type === "year") return docId;

    if (type === "class" || type === "day") {
      const c = classes.find((x) => x.documentId === docId);
      return c?.academic_year?.documentId;
    }

    const s = students.find((x) => x.documentId === docId);
    const cid = s?.class?.documentId;
    const c = classes.find((x) => x.documentId === cid);
    return c?.academic_year?.documentId;
  }, [type, docId, classes, students]);

  const names: Names = useMemo(() => {
    if (!type || !docId) return { breadcrumb: "" };

    if (type === "year") {
      const y = years.find((x) => x.documentId === docId);
      const year = y?.name;
      return { year, breadcrumb: fmtBreadcrumb(year) };
    }

    if (type === "class" || type === "day") {
      const c = classes.find((x) => x.documentId === docId);
      const klass = c?.name;

      const yid = c?.academic_year?.documentId;
      const y = years.find((x) => x.documentId === yid);
      const year = y?.name;

      const tail = type === "day" ? "授業日" : undefined;

      return {
        year,
        klass,
        breadcrumb: tail
          ? fmtBreadcrumb(year, klass, tail)
          : fmtBreadcrumb(year, klass),
      };
    }

    const s = students.find((x) => x.documentId === docId);
    const student = s?.name;

    const cid = s?.class?.documentId;
    const c = classes.find((x) => x.documentId === cid);
    const klass = c?.name;

    const yid = c?.academic_year?.documentId;
    const y = years.find((x) => x.documentId === yid);
    const year = y?.name;

    return {
      year,
      klass,
      student,
      breadcrumb: fmtBreadcrumb(year, klass, student),
    };
  }, [type, docId, years, classes, students]);

  useEffect(() => {
    if (!autoExpand) return;
    if (!type || !docId) return;
    if (!students.length || !classes.length || !years.length) return;

    const nextToExpand: string[] = [];

    if (type === "student") {
      const s = students.find((x) => x.documentId === docId);
      const cid = s?.class?.documentId;
      if (cid) nextToExpand.push(nodeKey("class", cid));

      const c = classes.find((x) => x.documentId === cid);
      const yid = c?.academic_year?.documentId;
      if (yid) nextToExpand.push(nodeKey("year", yid));
    }

    if (type === "class" || type === "day") {
      const c = classes.find((x) => x.documentId === docId);
      const yid = c?.academic_year?.documentId;
      if (yid) nextToExpand.push(nodeKey("year", yid));
    }

    if (nextToExpand.length === 0) return;

    setExpandedKeys((prev) => {
      const set = new Set(prev);
      let changed = false;

      for (const k of nextToExpand) {
        if (!set.has(k)) {
          set.add(k);
          changed = true;
        }
      }

      return changed ? Array.from(set) : prev;
    });
  }, [autoExpand, type, docId, students, classes, years, setExpandedKeys]);

  return {
    selectedType: type,
    selectedYearDocId,
    selectedClassDocId,
    selectedStudentDocId,
    selectedKey: selectedNodeKey,
    names,
  };
};
