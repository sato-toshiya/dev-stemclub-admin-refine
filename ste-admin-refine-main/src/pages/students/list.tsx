import {
  DeleteOutlined,
  DownloadOutlined,
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
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { fmtDate, fmtDateTime } from "@/common/utils";
import { academicStatusJa } from "@/common/utils/academicYear";

import { StudentImportModal } from "./_components/StudentImportModal";
import { getStudentColumns } from "./_components/studentColumns";
import { useStudentFilters } from "./_hooks/useStudentFilters";
import { useStudentImport } from "./_hooks/useStudentImport";
import { useStudentListActions } from "./_hooks/useStudentListActions";
import type { StudentRecord } from "./types";

const { Title, Text } = Typography;

export const StudentList = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { open } = useNotification();

  const notify = (params: OpenNotificationParams) => {
    open?.(params);
  };

  const invalidate = useInvalidate();
  const { mutateAsync: deleteMany } = useDeleteMany();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps, setFilters, tableQuery, setCurrentPage } =
    useTable<StudentRecord>({
      syncWithLocation: true,
      meta: {
        populate: {
          class: { fields: ["name", "documentId"] },
          projects: { fields: ["id"] },
          users_permissions_user: { fields: ["id", "email", "last_login_at"] },
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
  } = useStudentFilters(setFilters);

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

  const academicYearByDocId = useMemo(() => {
    const map = new Map<
      string,
      { name: string; academic_status: string; documentId: string }
    >();
    const records = Array.isArray(academicYearResult?.data)
      ? academicYearResult.data
      : [];

    for (const row of records) {
      const documentId = String(row?.documentId ?? "").trim();
      if (!documentId) continue;
      map.set(documentId, {
        name: String(row?.name ?? "").trim() || "-",
        academic_status: String(row?.academic_status ?? "").trim(),
        documentId,
      });
    }
    return map;
  }, [academicYearResult?.data]);

  const classByDocId = useMemo(() => {
    const map = new Map<string, { name: string; documentId: string }>();
    const records = Array.isArray(classResult?.data) ? classResult.data : [];
    for (const row of records) {
      const documentId = String(row?.documentId ?? "").trim();
      if (!documentId) continue;
      map.set(documentId, {
        name: String(row?.name ?? "").trim() || "-",
        documentId,
      });
    }
    return map;
  }, [classResult?.data]);

  useEffect(() => {
    if (classDocId) {
      setCurrentPage?.(1);
      applyFilters(q, classDocId, academicYearDocId);
    }
  }, [classDocId, q, academicYearDocId, applyFilters, setCurrentPage]);

  const {
    importOpen,
    importing,
    importFileList,
    importTargetSummary,
    openImportModal,
    closeImportModal,
    onImportFileChange,
    clearImportFile,
    onDoImport,
  } = useStudentImport({
    notify,
    modal,
    onSuccess: async () => {
      await invalidate({ resource: "students", invalidates: ["list"] });
      applyFilters(q, classDocId, academicYearDocId);
      await tableQuery?.refetch?.();
    },
  });

  const { onExportQrPdf, onBulkDelete } = useStudentListActions({
    modalConfirm: modal.confirm,
    notify,
    selectedRowKeys,
    setSelectedRowKeys,
    deleteMany,
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
    () => getStudentColumns({ fmtDate, fmtDateTime }),
    [],
  );

  const resolvedClassValue = useMemo(() => {
    if (!classDocId) return undefined;
    const hasOption = classOptions.some((o) => o.value === classDocId);
    if (!hasOption) return undefined;
    return classDocId;
  }, [classDocId, classOptions]);

  const resolvedAcademicYearValue = useMemo(() => {
    if (!academicYearDocId) return undefined;
    const hasOption = academicYearOptions.some(
      (o) => o.value === academicYearDocId,
    );
    return hasOption ? academicYearDocId : undefined;
  }, [academicYearDocId, academicYearOptions]);

  const onClickImport = () => {
    const selectedAcademicYear = academicYearDocId
      ? academicYearByDocId.get(academicYearDocId)
      : undefined;
    const selectedClass = classDocId ? classByDocId.get(classDocId) : undefined;

    const hasAcademicYear = !!selectedAcademicYear;
    const hasClass = !!selectedClass;

    if (hasAcademicYear && hasClass) {
      const ayStatus = selectedAcademicYear.academic_status;
      if (ayStatus !== "active" && ayStatus !== "pending") {
        modal.warning({
          centered: true,
          title: "インポート対象の年度が不正です",
          content:
            "生徒のインポート先として指定できるのは「実施中」または「準備中」の年度のみです。",
        });
        return;
      }

      const statusText = academicStatusJa(ayStatus);
      const ayLabel = `${selectedAcademicYear.name} (${statusText})`;
      const classLabel = selectedClass.name;

      modal.confirm({
        centered: true,
        title: "インポート確認",
        content: `生徒を「${classLabel}」（クラス年度: ${ayLabel}）にインポートします。よろしいですか？`,
        okText: "続行",
        cancelText: "キャンセル",
        onOk: () =>
          openImportModal({
            academicYearDocumentId: selectedAcademicYear.documentId,
            classDocumentId: selectedClass.documentId,
            academicYearLabel: ayLabel,
            classLabel,
          }),
      });
      return;
    }

    if (!hasAcademicYear && !hasClass) {
      modal.confirm({
        centered: true,
        title: "インポート確認",
        content:
          "クラス年度・クラスを指定せずにインポートすると、生徒はクラス未所属で登録されます。続行しますか？",
        okText: "続行",
        cancelText: "キャンセル",
        onOk: () => openImportModal(null),
      });
      return;
    }

    modal.warning({
      centered: true,
      title: "取り込み先の指定が不完全です",
      content:
        "取り込み先を指定する場合は、クラス年度とクラスを両方選択してください。",
    });
  };

  return (
    <List
      title={
        <div>
          <Title level={4} style={{ margin: "8px 0" }}>
            生徒一覧
          </Title>
          <Text type='secondary'>
            {typeof total === "number" ? `${total} 生徒` : ""}
          </Text>
        </div>
      }
      headerButtons={() => (
        <Space>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() =>
              navigate(
                classDocId
                  ? `/students/create?from=class&class=${encodeURIComponent(
                      classDocId,
                    )}`
                  : "/students/create",
              )
            }>
            新規生徒登録
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={onBulkDelete}>
            選択削除
          </Button>
        </Space>
      )}>
      <Space style={{ marginBottom: 30, gap: 14 }} wrap>
        <Input
          size='middle'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={() => {
            setCurrentPage?.(1);
            applyFilters(q, classDocId, academicYearDocId);
          }}
          prefix={<SearchOutlined style={{ fontSize: 10, marginRight: 8 }} />}
          placeholder='氏名、カナ名で検索'
          style={{ width: 280 }}
          allowClear
          onClear={() => {
            setQ("");
            setCurrentPage?.(1);
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
            setCurrentPage?.(1);
            applyFilters(q, undefined, nextAcademicYear);
          }}
          onClear={() => {
            setAcademicYearDocId(undefined);
            setClassDocId(undefined);
            setCurrentPage?.(1);
            applyFilters(q, undefined, undefined);
          }}
        />

        <Select
          options={classOptions}
          loading={classQuery?.isFetching}
          disabled={!academicYearDocId}
          allowClear
          placeholder='クラスで絞り込み'
          style={{ width: 210 }}
          value={resolvedClassValue}
          onChange={(v) => {
            const next = typeof v === "string" ? v : undefined;
            setClassDocId(next);
            setCurrentPage?.(1);
            applyFilters(q, next, academicYearDocId);
          }}
          onClear={() => {
            setClassDocId(undefined);
            setCurrentPage?.(1);
            applyFilters(q, undefined, academicYearDocId);
          }}
        />

        <Button icon={<UploadOutlined />} onClick={onClickImport}>
          CSV/XLSXインポート
        </Button>

        <Button icon={<DownloadOutlined />} onClick={onExportQrPdf}>
          QR PDF出力
        </Button>
      </Space>

      <Table<StudentRecord>
        {...tableProps}
        columns={columns}
        rowKey='documentId'
        rowSelection={rowSelection}
        size='middle'
        tableLayout='fixed'
        scroll={{ x: 1300 }}
        pagination={{
          ...tableProps.pagination,
          size: "default",
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />

      <StudentImportModal
        open={importOpen}
        loading={importing}
        fileList={importFileList}
        targetSummary={importTargetSummary}
        onOk={onDoImport}
        onCancel={closeImportModal}
        onChange={onImportFileChange}
        onClear={clearImportFile}
      />
    </List>
  );
};
