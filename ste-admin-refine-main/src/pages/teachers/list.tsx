import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import {
  BaseRecord,
  OpenNotificationParams,
  useDeleteMany,
  useInvalidate,
  useList,
  useNotification,
} from "@refinedev/core";
import { App, Button, Input, Select, Space, Table, Typography } from "antd";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { academicStatusJa } from "@/common/utils/academicYear";

import { getTeacherColumns } from "./_components/teacherColumns";
import { useTeacherFilters } from "./_hooks/useTeacherFilters";
import { useTeacherImport } from "./_hooks/useTeacherImport";
import { useTeacherListActions } from "./_hooks/useTeacherListActions";
import type { TeacherRecord } from "./types";
import { TeacherImportModal } from "./_components/TeacherImportModal";

const { Title, Text } = Typography;

export const TeacherList = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { open } = useNotification();
  const notify = (p: OpenNotificationParams) => open?.(p);

  const invalidate = useInvalidate();

  const { mutateAsync: deleteMany, mutation } = useDeleteMany();
  const deletingMany = mutation.isPending;

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps, setFilters } = useTable<TeacherRecord>({
    syncWithLocation: true,
    meta: {
      populate: {
        users_permissions_user: { fields: ["email", "phone", "blocked"] },
        classes: { fields: ["name", "documentId"] },
      },
    },
  });

  const {
    q,
    setQ,
    classDocId,
    setClassDocId,
    academicYearDocId,
    setAcademicYearDocId,
    applyFilters,
    resetFilters,
  } = useTeacherFilters(setFilters);

  const { result: academicYearResult, query: academicYearQuery } =
    useList<BaseRecord>({
      resource: "academic-years",
      pagination: { mode: "off" },
      meta: { fields: ["name", "documentId", "academic_status"] },
    });

  const { result: classResult, query: classQuery } = useList<BaseRecord>({
    resource: "classes",
    pagination: { mode: "off" },
    filters: academicYearDocId
      ? [
          {
            field: "academic_year.documentId",
            operator: "eq",
            value: academicYearDocId,
          },
        ]
      : [{ field: "documentId", operator: "eq", value: "__none__" }],
    meta: {
      fields: ["name", "documentId"],
      populate: {
        academic_year: { fields: ["name", "documentId"] },
      },
    },
    sorters: [{ field: "name", order: "asc" }],
  });

  const academicYearOptions = useMemo(() => {
    const statusPriority: Record<string, number> = {
      active: 0,
      pending: 1,
      archived: 2,
    };

    const records = Array.isArray(academicYearResult?.data)
      ? [...academicYearResult.data]
      : [];

    records.sort((a, b) => {
      const aStatus = String(a?.academic_status ?? "");
      const bStatus = String(b?.academic_status ?? "");
      const byStatus =
        (statusPriority[aStatus] ?? 9) - (statusPriority[bStatus] ?? 9);
      if (byStatus !== 0) return byStatus;

      const aName = String(a?.name ?? "");
      const bName = String(b?.name ?? "");
      return aName.localeCompare(bName, "ja");
    });

    return records
      .map((row) => {
        const name = String(row?.name ?? "").trim();
        const documentId = String(row?.documentId ?? row?.id ?? "").trim();
        const status = String(row?.academic_status ?? "").trim();
        if (!name || !documentId) return null;
        return {
          value: documentId,
          label: `${name} (${academicStatusJa(status)})`,
        };
      })
      .filter((v): v is { value: string; label: string } => v !== null);
  }, [academicYearResult?.data]);

  const classOptions = useMemo(() => {
    const records = Array.isArray(classResult?.data) ? classResult.data : [];

    return records
      .map((row) => {
        const className = String(row?.name ?? "").trim() || "-";
        const classDocId = String(row?.documentId ?? row?.id ?? "").trim();
        if (!classDocId) return null;

        return {
          value: classDocId,
          label: className,
        };
      })
      .filter((v): v is { value: string; label: string } => v !== null);
  }, [classResult?.data]);

  const {
    importOpen,
    importing,
    importFileList,
    openImportModal,
    closeImportModal,
    onImportFileChange,
    clearImportFile,
    onDoImport,
  } = useTeacherImport({
    notify,
    modal,
    onSuccess: async () => {
      await invalidate({
        resource: "teachers",
        invalidates: ["list"],
      });
      applyFilters(q, classDocId, academicYearDocId);
    },
  });

  const { onBulkDelete } = useTeacherListActions({
    modalConfirm: modal.confirm,
    notify,
    selectedRowKeys,
    setSelectedRowKeys,
    deleteMany,
    deletingMany,
    invalidate,
    q,
    classDocId,
    academicYearDocId,
    applyFilters,
    classOptions,
  });

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    }),
    [selectedRowKeys],
  );

  const total =
    tableProps.pagination !== false ? tableProps.pagination?.total : undefined;

  const columns = useMemo(
    () =>
      getTeacherColumns({
        q,
        classDocId,
        onApplyBlocked: (blocked?: boolean) =>
          applyFilters(q, classDocId, academicYearDocId, blocked),
        onResetAll: () => resetFilters(),
      }),
    [q, classDocId, academicYearDocId, applyFilters, resetFilters],
  );

  const resolvedAcademicYearValue = useMemo(() => {
    if (!academicYearDocId) return undefined;
    const hasOption = academicYearOptions.some((o) => o.value === academicYearDocId);
    return hasOption ? academicYearDocId : undefined;
  }, [academicYearDocId, academicYearOptions]);

  const resolvedClassValue = useMemo(() => {
    if (!classDocId) return undefined;

    const hasOption = classOptions.some((o) => o.value === classDocId);

    return hasOption ? classDocId : undefined;
  }, [classDocId, classOptions]);

  return (
    <List
      title={
        <div>
          <Title level={4} style={{ margin: "8px 0" }}>
            教師一覧
          </Title>
          <Text type='secondary'>
            {typeof total === "number" ? `${total} 教師` : ""}
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
            onClick={() => navigate("/teachers/create")}>
            新規教師登録
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
          onChange={(e) => {
            const next = e.target.value;
            setQ(next);
            if (next === "") applyFilters("", classDocId, academicYearDocId);
          }}
          onPressEnter={() => applyFilters(q, classDocId, academicYearDocId)}
          prefix={<SearchOutlined style={{ fontSize: 10, marginRight: 8 }} />}
          placeholder='先生名 / メール / 電話で検索'
          style={{ width: 360 }}
          allowClear
          onClear={() => {
            setQ("");
            applyFilters("", classDocId, academicYearDocId);
          }}
        />

        <Select
          options={academicYearOptions}
          loading={academicYearQuery?.isFetching}
          allowClear
          placeholder='クラス年度で絞り込み'
          style={{ width: 260 }}
          value={resolvedAcademicYearValue}
          onChange={(v) => {
            const nextAcademicYear = typeof v === "string" ? v : undefined;
            setAcademicYearDocId(nextAcademicYear);
            setClassDocId(undefined);
            applyFilters(q, undefined, nextAcademicYear);
          }}
          onClear={() => {
            setAcademicYearDocId(undefined);
            setClassDocId(undefined);
            applyFilters(q, undefined, undefined);
          }}
        />

        <Select
          options={classOptions}
          loading={classQuery?.isFetching}
          disabled={!academicYearDocId}
          allowClear
          placeholder='クラスで絞り込み'
          style={{ width: 240 }}
          value={resolvedClassValue}
          onChange={(v) => {
            const next = typeof v === "string" ? v : undefined;
            setClassDocId(next);
            applyFilters(q, next, academicYearDocId);
          }}
          onClear={() => {
            setClassDocId(undefined);
            applyFilters(q, undefined, academicYearDocId);
          }}
        />
      </Space>

      <Table<TeacherRecord>
        {...tableProps}
        columns={columns}
        rowKey='documentId'
        rowSelection={rowSelection}
        size='middle'
        tableLayout='fixed'
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />

      <TeacherImportModal
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
