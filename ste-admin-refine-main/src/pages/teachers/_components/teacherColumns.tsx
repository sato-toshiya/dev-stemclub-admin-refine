import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { DeleteButton, EditButton } from "@refinedev/antd";
import type { ColumnsType } from "antd/es/table";
import { Button, Space, Tag, Typography } from "antd";
import React from "react";
import type { TeacherRecord } from "../types";

const { Text } = Typography;

const formatTeacherClasses = (names: string[]) => {
  const clean = names.filter(Boolean);
  if (clean.length === 0) return "-";
  if (clean.length <= 2) return clean.join(", ");
  return `${clean[0]}, 他${clean.length - 1}クラス`;
};

type StatusDropdownProps = { confirm: () => void };

type Deps = {
  q: string;
  classDocId?: string;
  onApplyBlocked: (blocked?: boolean) => void;
  onResetAll: () => void;
};

export const getTeacherColumns = ({
  q,
  classDocId,
  onApplyBlocked,
  onResetAll,
}: Deps): ColumnsType<TeacherRecord> => {
  const statusFilterDropdown = ({ confirm }: StatusDropdownProps) => (
    <div style={{ padding: 8 }}>
      <Space direction='vertical'>
        <Button
          onClick={() => {
            onApplyBlocked(false);
            confirm();
          }}>
          有効
        </Button>

        <Button
          onClick={() => {
            onApplyBlocked(true);
            confirm();
          }}>
          無効
        </Button>

        <Button
          onClick={() => {
            onResetAll();
            confirm();
          }}>
          全て
        </Button>

        <div style={{ color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
          現在: {q ? `検索「${q}」` : "検索なし"}
          {classDocId ? ` / クラス絞り込みあり` : ""}
        </div>
      </Space>
    </div>
  );

  return [
    { dataIndex: "name", title: "先生名" },
    {
      title: "メールアドレス",
      render: (_: unknown, record) =>
        record?.email ?? record?.users_permissions_user?.email ?? "-",
    },
    {
      title: "電話番号",
      render: (_: unknown, record) =>
        record?.phone ?? record?.users_permissions_user?.phone ?? "-",
    },
    { dataIndex: "passcode", title: "PASSCODE" },
    {
      title: "クラス",
      render: (_: unknown, record) => {
        const names = Array.isArray(record?.classes)
          ? (record.classes.map((c) => c?.name).filter(Boolean) as string[])
          : [];
        return <Text>{formatTeacherClasses(names)}</Text>;
      },
    },
    {
      title: "ステータス",
      key: "status",
      filterDropdown: statusFilterDropdown,
      render: (_: unknown, record) => {
        const isBlocked = record?.users_permissions_user?.blocked;
        return (
          <Tag
            color={isBlocked ? "error" : "success"}
            icon={
              isBlocked ? (
                <CloseCircleTwoTone twoToneColor='#ff4d4f' />
              ) : (
                <CheckCircleTwoTone twoToneColor='#52c41a' />
              )
            }>
            {isBlocked ? "無効" : "有効"}
          </Tag>
        );
      },
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
};
