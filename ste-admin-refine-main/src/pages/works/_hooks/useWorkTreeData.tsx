import { useMemo } from "react";
import type { DataNode } from "antd/es/tree";
import { FolderOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { AcademicYearRecord, ClassRecord, StudentRecord } from "@/common/types";
import { nodeKey } from "@/common/utils";
import { academicStatusJa } from "@/common/utils/academicYear";

const { Text } = Typography;

export const useWorkTreeData = (
  years: AcademicYearRecord[],
  classes: ClassRecord[],
  students: StudentRecord[],
) => {
  const classesByYear = useMemo(() => {
    const map: Record<string, ClassRecord[]> = {};
    for (const c of classes) {
      const yid = c.academic_year?.documentId;
      if (!yid) continue;
      (map[yid] ||= []).push(c);
    }
    return map;
  }, [classes]);

  const studentsByClass = useMemo(() => {
    const map: Record<string, StudentRecord[]> = {};
    for (const s of students) {
      const cid = s.class?.documentId;
      if (!cid) continue;
      (map[cid] ||= []).push(s);
    }
    return map;
  }, [students]);

  const treeData: DataNode[] = useMemo(() => {
    return years.map((y) => {
      const yid = y.documentId ?? String(y.id);

      const yChildren = (classesByYear[yid] ?? []).map((c) => {
        const cid = c.documentId ?? String(c.id);

        const cChildren = (studentsByClass[cid] ?? []).map((s) => {
          const sid = s.documentId ?? String(s.id);
          return {
            key: nodeKey("student", sid),
            title: s.name ?? "-",
            icon: <FolderOutlined />,
            isLeaf: true,
          } as DataNode;
        });

        return {
          key: nodeKey("class", cid),
          title: c.name ?? "-",
          icon: <FolderOutlined />,
          children: cChildren,
        } as DataNode;
      });

      const statusText = academicStatusJa(y.academic_status);
      const yearTitle = (
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          {y.name ?? "-"}
          {statusText ? (
            <Text type='secondary' style={{ fontSize: 12 }}>
              ({statusText})
            </Text>
          ) : null}
        </span>
      );

      return {
        key: nodeKey("year", yid),
        title: yearTitle,
        icon: <FolderOutlined />,
        children: yChildren,
      } as DataNode;
    });
  }, [years, classesByYear, studentsByClass]);

  return { treeData };
};
