import { DateField, DeleteButton, EditButton } from "@refinedev/antd";
import type { ColumnsType } from "antd/es/table";
import { Space } from "antd";

import type { SchoolAdminRecord } from "../types";

export const getSchoolAdminColumns = (): ColumnsType<SchoolAdminRecord> => {
  return [
    {
      dataIndex: "name",
      title: "法人名",
      width: 180,
      sorter: true,
      render: (name: string) => <span className='cell-strong'>{name}</span>,
    },
    {
      dataIndex: "email",
      title: "メールアドレス",
      width: 220,
      render: (_, record) => record?.users_permissions_users?.[0]?.email ?? "-",
    },
    {
      dataIndex: "address",
      title: "所在地",
      ellipsis: true,
      width: 260,
      sorter: true,
    },
    {
      dataIndex: "representor",
      title: "担当者名",
      width: 140,
      sorter: true,
    },
    {
      dataIndex: "phone",
      title: "電話番号",
      width: 140,
      render: (_, record) => record?.users_permissions_users?.[0]?.phone ?? "-",
    },
    {
      dataIndex: "blocked",
      title: "ステータス",
      width: 120,
      render: (_, record) => {
        const isBlocked = record?.users_permissions_users?.[0]?.blocked;
        return (
          <span className={`status ${isBlocked ? "inactive" : "active"}`}>
            <span className='dot' />
            {isBlocked ? "無効" : "有効"}
          </span>
        );
      },
    },
    {
      dataIndex: "updatedAt",
      title: "最終更新日",
      width: 140,
      sorter: true,
      render: (value: string) => (value ? <DateField value={value} /> : "-"),
    },
    {
      title: "",
      dataIndex: "actions",
      width: 80,
      fixed: "right",
      align: "right",
      render: (_, record) => (
        <Space size={6}>
          <EditButton
            hideText
            size='small'
            type='text'
            recordItemId={record.documentId ?? record.id}
          />
          <DeleteButton
            hideText
            size='small'
            type='text'
            recordItemId={record.documentId ?? record.id}
          />
        </Space>
      ),
    },
  ];
};
