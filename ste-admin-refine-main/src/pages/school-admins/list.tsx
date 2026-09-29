import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import {
  OpenNotificationParams,
  useDeleteMany,
  useInvalidate,
  useNotification,
} from "@refinedev/core";
import { App, Button, Input, Space, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import type { SchoolAdminRecord } from "./types";
import { getSchoolAdminColumns } from "./_components/schoolAdminColumns";
import { useSchoolAdminFilters } from "./_hooks/useSchoolAdminFilters";
import { useSchoolAdminImport } from "./_hooks/useSchoolAdminImport";
import { SchoolAdminImportModal } from "./_components/SchoolAdminImportModal";
import { useSchoolAdminListActions } from "./_hooks/useSchoolAdminListActions";

const { Title, Text } = Typography;

export const SchoolAdminList = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { open } = useNotification();
  const notify = (p: OpenNotificationParams) => open?.(p);
  const invalidate = useInvalidate();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps, setFilters } = useTable<SchoolAdminRecord>({
    syncWithLocation: true,
    meta: {
      populate: {
        users_permissions_users: { fields: ["email", "phone", "blocked"] },
      },
    },
  });

  const { q, setQ, status, applyFilters } = useSchoolAdminFilters(setFilters);

  const { mutateAsync: deleteMany, mutation } = useDeleteMany();
  const deletingMany = mutation.isPending;
  const { onBulkDelete } = useSchoolAdminListActions({
    modalConfirm: modal.confirm,
    notify,
    selectedRowKeys,
    setSelectedRowKeys,
    deleteMany,
    deletingMany,
    invalidate,
    q,
    status,
    applyFilters,
  });

  const rowSelection = useMemo(
    () => ({
      columnWidth: 48,
      selectedRowKeys,
      onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    }),
    [selectedRowKeys],
  );

  const {
    importOpen,
    importing,
    importFileList,
    openImportModal,
    closeImportModal,
    onImportFileChange,
    clearImportFile,
    onDoImport,
  } = useSchoolAdminImport({
    modal,
    notify,
    onSuccess: async () => {
      await invalidate({
        resource: "school-admins",
        invalidates: ["list"],
      });
      applyFilters(q, status);
    },
  });

  const total =
    tableProps.pagination !== false ? tableProps.pagination?.total : undefined;

  const columns = useMemo(() => getSchoolAdminColumns(), []);

  return (
    <List
      title={
        <div>
          <Title level={2} style={{ margin: "8px 0" }}>
            法人一覧
          </Title>
          <Text type='secondary'>
            {typeof total === "number" ? `${total} 法人` : ""}
          </Text>
        </div>
      }
      headerButtons={() => (
        <Space>
          <Button icon={<UploadOutlined />} onClick={openImportModal}>
            CSVインポート
          </Button>

          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => navigate("/school-admins/create")}>
            新規法人登録
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={deletingMany}
            onClick={onBulkDelete}>
            選択を削除
          </Button>
        </Space>
      )}>
      <Space style={{ marginBottom: 30, gap: 14 }} wrap>
        <Input
          size='middle'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={() => applyFilters(q, status)}
          prefix={<SearchOutlined style={{ fontSize: 10, marginRight: 8 }} />}
          placeholder='法人名、担当者名、メールで検索'
          style={{ width: 417 }}
          allowClear
          onClear={() => {
            setQ("");
            applyFilters("", status);
          }}
        />

        {/* <Select<StatusFilter>
          size='middle'
          value={status}
          onChange={(v) => {
            setStatus(v);
            applyFilters(q, v);
          }}
          style={{ width: 190 }}
          options={[
            { label: "すべてのステータス", value: "all" },
            { label: "有効", value: "active" },
            { label: "無効", value: "inactive" },
          ]}
        /> */}
      </Space>

      <Table<SchoolAdminRecord>
        {...tableProps}
        columns={columns}
        rowKey={(r) => r.documentId ?? String(r.id ?? "")}
        rowSelection={rowSelection}
        size='middle'
        tableLayout='fixed'
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />

      <SchoolAdminImportModal
        open={importOpen}
        loading={importing}
        fileList={importFileList}
        onOk={onDoImport}
        onCancel={closeImportModal}
        onChange={onImportFileChange}
        onClear={clearImportFile}
      />
    </List>
  );
};
