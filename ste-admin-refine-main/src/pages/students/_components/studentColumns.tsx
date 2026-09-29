import { DeleteButton, EditButton } from "@refinedev/antd";
import type { ColumnsType } from "antd/es/table";
import { Space, Typography } from "antd";
import type { StudentRecord } from "../types";

const { Text } = Typography;

type Deps = {
  fmtDate: (v?: string) => string;
  fmtDateTime: (v?: string) => string;
};

export const getStudentColumns = ({
  fmtDate,
  fmtDateTime,
}: Deps): ColumnsType<StudentRecord> => [
  {
    dataIndex: "name",
    title: "氏名",
    width: 180,
    ellipsis: true,
    render: (v?: string) => (
      <Text
        strong
        title={v ?? "-"}
        ellipsis={{ tooltip: v ?? "-" }}
        style={{ display: "block" }}>
        {v ?? "-"}
      </Text>
    ),
  },
  {
    dataIndex: "name_kana",
    title: "カナ名",
    width: 180,
    onCell: () => ({
      style: { maxWidth: 180 },
    }),
    ellipsis: true,
  },
  {
    dataIndex: "birthday",
    title: "生年月日",
    width: 140,
    render: (v: string | undefined) => fmtDate(v),
  },
  {
    title: "クラス",
    dataIndex: ["class", "name"],
    width: 140,
    ellipsis: true,
    render: (_: unknown, record) => record.class?.name ?? "-",
  },
  {
    dataIndex: "guardian_name",
    title: "保護者名",
    width: 180,
    ellipsis: true,
    render: (v: string | undefined) => v ?? "-",
  },
  {
    title: "プロジェクト数",
    width: 120,
    render: (_: unknown, record) => record.projectsCount,
  },
  {
    title: "コード",
    dataIndex: "code",
    key: "code",
    width: 120,
    ellipsis: true,
    render: (v) => (typeof v === "string" && v.trim() ? v : "-"),
  },
  {
    title: "最終ログイン",
    width: 140,
    render: (_: unknown, record) => fmtDateTime(record.last_seen_at),
  },
  {
    title: "",
    dataIndex: "actions",
    width: 90,
    render: (_: unknown, record) => (
      <Space>
        <EditButton
          hideText
          size='small'
          recordItemId={record.documentId ?? record.id}
        />
        <DeleteButton
          hideText
          size='small'
          recordItemId={record.documentId ?? record.id}
        />
      </Space>
    ),
  },
];
