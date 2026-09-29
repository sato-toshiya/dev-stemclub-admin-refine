import React, { useCallback, useMemo, useState } from "react";

import { Button, Pagination, Typography, notification } from "antd";
import type { MenuProps } from "antd";
import type { Dayjs } from "dayjs";

import { List } from "@refinedev/antd";
import type { DataProvider } from "@refinedev/core";
import { useDataProvider } from "@refinedev/core";

import { getErrorMessage } from "@/common/helpers/error";
import type { ProjectRecord, SortKey } from "@/common/types";
import { parseNodeKey } from "@/common/utils";

import { usePersistedExpandedKeys } from "./_hooks/usePersistedExpandedKeys";
import { useProjectsTable } from "./_hooks/useProjectsTable";
import { useWorkReferenceData } from "./_hooks/useWorkReferenceData";
import { useWorkSelection } from "./_hooks/useWorkSelection";
import { useWorkTreeData } from "./_hooks/useWorkTreeData";

import { FolderGrid, type FolderItem } from "./_components/FolderGrid";
import { MoveProjectModal } from "./_components/MoveProjectModal";
import { ProjectsGrid } from "./_components/ProjectsGrid";
import { WorkPreviewModal } from "./_components/WorkPreviewModal";
import { WorkTreePanel } from "./_components/WorkTreePanel";
import dayjs from "dayjs";
import { useWorkFolders } from "./_hooks/useWorkFolders";
import { useWorkNavigation } from "./_hooks/useWorkNavigation";
import { WorkToolbar } from "./_components/WorkToolbar";
import { useClassDaysInMonth } from "./_hooks/useClassDaysInMonth";

const { Title, Text } = Typography;

export const WorkManagement = () => {
  const {
    years,
    classes,
    students,
    refetchAll,
    loading: refLoading,
  } = useWorkReferenceData();

  const { expandedKeys, setExpandedKeys, onExpand } =
    usePersistedExpandedKeys();

  const { treeData } = useWorkTreeData(years, classes, students);

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [classDay, setClassDay] = useState<Dayjs>(() => dayjs());
  const [classMonth, setClassMonth] = useState<Dayjs>(() => {
    const sp = new URLSearchParams(window.location.search);
    const m = sp.get("month");
    const d = m ? dayjs(`${m}-01`) : dayjs();
    return d.isValid() ? d : dayjs();
  });
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(() => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("node");
  });

  const [preview, setPreview] = useState<ProjectRecord | null>(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [sharingDayKey, setSharingDayKey] = useState<string | null>(null);
  const [noticeApi, noticeContextHolder] = notification.useNotification();

  const [autoExpandParent] = useState(false);

  const selection = useWorkSelection({
    selectedNodeKey,
    years,
    classes,
    students,
    setExpandedKeys,
    autoExpand: false,
  });

  const selectedType = selection.selectedType;
  const selectedYearDocId = selection.selectedYearDocId;
  const selectedClassDocId = selection.selectedClassDocId;
  const studentDocId = selection.selectedStudentDocId;
  const classDocIdForDay =
    selectedType === "day" ? selectedClassDocId : undefined;

  const isClassDayMode = selectedType === "day";
  const isClassNode = selectedType === "class";

  const { days: classDayRows, loading: classDaysLoading } = useClassDaysInMonth(
    {
      enabled: isClassNode && !!selectedClassDocId,
      classDocId: selectedClassDocId ?? undefined,
      month: classMonth,
    },
  );
  const {
    tableProps,
    resetPage,
    refetch,
    isFetching,
    currentPage,
    pageSize,
    total,
    setCurrentPage,
    setPageSize,
  } = useProjectsTable({
    mode: isClassDayMode ? "classDay" : "student",
    studentDocId: isClassDayMode ? undefined : studentDocId,
    classDocId: isClassDayMode ? classDocIdForDay : undefined,
    classDay: isClassDayMode ? classDay : null,
    range,
    sortKey,
  });

  const { yearFolders, classFolders, studentFolders } = useWorkFolders({
    selectedType,
    selectedYearDocId,
    selectedClassDocId,
    years,
    classes,
    students,
    classDayRows,
  });

  const onChangeClassMonth = useCallback((m: Dayjs) => {
    setClassMonth(m);

    const sp = new URLSearchParams(window.location.search);
    sp.set("month", m.format("YYYY-MM"));

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${sp.toString()}`,
    );
  }, []);

  const { navigateToNode } = useWorkNavigation({
    selectedNodeKey,
    classDay,
    setClassDay,
    setClassMonth: onChangeClassMonth,
    setRange,
    setSelectedNodeKey,
    resetPage,
  });

  const selectedStudentName = useMemo(() => {
    if (!studentDocId) return "-";
    return students.find((s) => s.documentId === studentDocId)?.name ?? "-";
  }, [students, studentDocId]);

  const projects = useMemo(() => {
    if (!(selectedType === "student" || selectedType === "day")) return [];
    return Array.isArray(tableProps.dataSource)
      ? (tableProps.dataSource as ProjectRecord[])
      : [];
  }, [selectedType, tableProps.dataSource]);

  const isStudentList = selectedType === "student";
  const isClassDayList = selectedType === "day";

  const onBackFolder = useCallback(() => {
    if (!selectedType) return;

    if (selectedType === "student" && selectedClassDocId) {
      navigateToNode(`class:${selectedClassDocId}`);
      return;
    }

    if (selectedType === "class" && selectedYearDocId) {
      navigateToNode(`year:${selectedYearDocId}`);
      return;
    }

    if (selectedType === "day" && selectedClassDocId) {
      navigateToNode(`class:${selectedClassDocId}`);
      return;
    }

    navigateToNode(null);
  }, [selectedType, selectedClassDocId, selectedYearDocId, navigateToNode]);

  const onSelectTree = useCallback(
    (keys: React.Key[]) => {
      const key = String(keys?.[0] ?? "");
      if (!key) return;
      navigateToNode(key);
    },
    [navigateToNode],
  );

  const onClickFolder = useCallback(
    (key: string) => {
      if (!key) return;
      navigateToNode(key);
    },
    [navigateToNode],
  );

  const copyText = useCallback(async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }, []);

  const onSortClick = useCallback<NonNullable<MenuProps["onClick"]>>(
    ({ key }) => setSortKey(key as SortKey),
    [],
  );

  type RangeValue = [Dayjs | null, Dayjs | null] | null;

  const onRangeChange = useCallback(
    (dates: RangeValue) => {
      if (selectedType !== "student") return;

      const next: [Dayjs | null, Dayjs | null] = dates ?? [null, null];
      setRange(next);

      const sp = new URLSearchParams(window.location.search);

      if (next[0]) sp.set("from", next[0].startOf("day").toISOString());
      else sp.delete("from");

      if (next[1]) sp.set("to", next[1].endOf("day").toISOString());
      else sp.delete("to");

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${sp.toString()}`,
      );

      resetPage();
    },
    [selectedType, resetPage],
  );

  const sortMenu = useMemo<MenuProps>(
    () => ({
      items: [
        { key: "newest", label: "新しい順" },
        { key: "oldest", label: "古い順" },
        { key: "title_asc", label: "名前 A-Z" },
        { key: "title_desc", label: "名前 Z-A" },
      ],
      onClick: onSortClick,
    }),
    [onSortClick],
  );

  const openWorkModal = useCallback((p: ProjectRecord) => {
    setPreview(p);
  }, []);

  const closeWorkModal = useCallback(() => {
    setPreview(null);
  }, []);

  const getDataProvider = useDataProvider();
  const dataProvider = getDataProvider() as Required<DataProvider>;

  const refreshProjects = useCallback(() => {
    resetPage();
    refetch();
    refetchAll();
  }, [resetPage, refetch, refetchAll]);

  const onConfirmRename = useCallback(
    async ({ documentId, title }: { documentId: string; title: string }) => {
      const next = title.trim();
      if (!next) throw new Error("新しい作品名を入力してください。");

      await dataProvider.custom({
        url: `${dataProvider.getApiUrl()}/projects/admin/${documentId}/title`,
        method: "put",
        payload: { title: next },
      });

      setPreview((prev) => (prev ? { ...prev, title: next } : prev));
      refreshProjects();
    },
    [dataProvider, refreshProjects],
  );

  const onDeleteProject = useCallback(
    async (documentId: string) => {
      try {
        await dataProvider.custom({
          url: `${dataProvider.getApiUrl()}/projects/admin/${documentId}`,
          method: "delete",
        });

        setPreview(null);
        refreshProjects();
      } catch (e: unknown) {
        throw new Error(getErrorMessage(e, "削除に失敗しました"));
      }
    },
    [dataProvider, refreshProjects],
  );

  const onTransferProject = useCallback(
    async ({
      documentId,
      toStudentDocId,
    }: {
      documentId: string;
      toStudentDocId: string;
    }) => {
      await dataProvider.custom({
        url: `${dataProvider.getApiUrl()}/projects/admin/${documentId}/transfer-student`,
        method: "put",
        payload: { toStudent: toStudentDocId },
      });

      setMoveOpen(false);
      setPreview(null);
      refreshProjects();
    },
    [dataProvider, refreshProjects],
  );

  const VIEWER_BASE = `${window.location.origin}/viewer/`;

  const onShareProject = useCallback(
    async (p: ProjectRecord) => {
      const docId = p.documentId ?? String(p.id ?? "");
      if (!docId) throw new Error("Missing project id");

      const res = await dataProvider.custom({
        url: `${dataProvider.getApiUrl()}/projects/admin/${docId}/share`,
        method: "post",
      });
      const token = res?.data?.token;
      if (!token) throw new Error("Share token not returned");

      return `${VIEWER_BASE}${encodeURIComponent(token)}`;
    },
    [dataProvider, VIEWER_BASE],
  );

  const onShareDayFolder = useCallback(
    async (item: FolderItem) => {
      const parsed = parseNodeKey(item.key);
      if (parsed.type !== "day") return;

      setSharingDayKey(item.key);
      try {
        const res = await dataProvider.custom({
          url: `${dataProvider.getApiUrl()}/projects/admin/share-day`,
          method: "post",
          payload: {
            class: parsed.docId,
            day: parsed.date,
          },
        });

        const token = res?.data?.token;
        if (!token) throw new Error("Share token not returned");

        const shareUrl = `${VIEWER_BASE}${encodeURIComponent(token)}`;
        await copyText(shareUrl);

        noticeApi.success({
          message: "共有リンクをコピーしました",
          description: shareUrl,
        });
      } catch (error) {
        noticeApi.error({
          message: "共有リンクの作成に失敗しました",
          description: getErrorMessage(error),
        });
      } finally {
        setSharingDayKey(null);
      }
    },
    [copyText, dataProvider, noticeApi, VIEWER_BASE],
  );
  const onPageChange = useCallback(
    (page: number, nextPageSize: number) => {
      if (nextPageSize !== pageSize) {
        setPageSize?.(nextPageSize);
        setCurrentPage?.(1);
        return;
      }
      setCurrentPage?.(page);
    },
    [pageSize, setCurrentPage, setPageSize],
  );

  return (
    <List
      title={
        <Title level={4} style={{ margin: "8px 0" }}>
          作品管理
        </Title>
      }
      headerButtons={() => null}>
      {noticeContextHolder}
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: "0 0 340px", width: 340, minWidth: 340 }}>
          <WorkTreePanel
            autoExpandParent={autoExpandParent}
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            onSelect={onSelectTree}
            selectedKey={selectedNodeKey}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <WorkToolbar
            selectedType={selectedType}
            breadcrumb={selection.names.breadcrumb}
            onBackFolder={onBackFolder}
            classMonth={classMonth}
            setClassMonth={onChangeClassMonth}
            range={range}
            onRangeChange={onRangeChange}
            sortMenu={sortMenu}
          />

          <div style={{ marginBottom: 16 }}>
            {isStudentList || isClassDayList ? (
              <div style={{ marginBottom: 16 }}>
                <Text>{`${projects.length}件の作品を表示中`}</Text>
              </div>
            ) : null}
          </div>

          {!selectedType ? (
            <FolderGrid
              listKey='years'
              items={yearFolders}
              emptyText='年度がありません'
              onClick={onClickFolder}
              infinite={{ enabled: true, step: 24 }}
              loading={refLoading || classDaysLoading}
            />
          ) : selectedType === "year" ? (
            <FolderGrid
              listKey={`year:${selectedYearDocId}`}
              items={classFolders}
              emptyText='クラスがありません'
              onClick={onClickFolder}
              infinite={{ enabled: true, step: 24 }}
              loading={refLoading || classDaysLoading}
            />
          ) : selectedType === "class" ? (
            <FolderGrid
              listKey={`class:${selectedClassDocId}`}
              items={studentFolders}
              emptyText='生徒がありません'
              onClick={onClickFolder}
              renderItemAction={(item) => {
                const parsed = parseNodeKey(item.key);
                if (parsed.type !== "day") return null;

                return (
                  <Button
                    size='small'
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void onShareDayFolder(item);
                    }}
                    loading={sharingDayKey === item.key}>
                    共有
                  </Button>
                );
              }}
              infinite={{ enabled: true, step: 24 }}
              loading={refLoading || classDaysLoading}
            />
          ) : (
            <>
              <ProjectsGrid
                mode={selectedType === "day" ? "classDay" : "student"}
                selectedStudentDocId={studentDocId}
                projects={projects}
                onClickProject={openWorkModal}
                loading={isFetching}
              />

              {typeof total === "number" && total > 0 ? (
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}>
                  <Pagination
                    current={currentPage ?? 1}
                    pageSize={pageSize ?? 15}
                    total={total}
                    showSizeChanger
                    pageSizeOptions={[15, 30, 50, 100]}
                    onChange={onPageChange}
                    onShowSizeChange={onPageChange}
                    showTotal={(t, range) => `${range[0]}-${range[1]} / ${t}件`}
                  />
                </div>
              ) : null}

              <WorkPreviewModal
                open={!!preview}
                project={preview}
                onClose={closeWorkModal}
                onConfirmRename={onConfirmRename}
                onDelete={onDeleteProject}
                downloadUrl={preview?.sjr_file?.url}
                existingTitles={projects
                  .map((p) => p.title ?? "")
                  .filter((t) => t.trim().length > 0)}
                studentName={selectedStudentName}
                onMove={() => setMoveOpen(true)}
                onShare={onShareProject}
              />

              <MoveProjectModal
                open={moveOpen}
                project={preview}
                currentStudentName={selectedStudentName}
                currentClassName={selection.names.klass}
                years={years}
                classes={classes}
                students={students}
                onCancel={() => setMoveOpen(false)}
                onSubmit={onTransferProject}
              />
            </>
          )}
        </div>
      </div>
    </List>
  );
};

export default WorkManagement;
