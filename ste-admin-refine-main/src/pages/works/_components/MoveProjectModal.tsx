import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Divider,
  Flex,
  Input,
  Modal,
  Select,
  Typography,
  Alert,
  List,
} from "antd";
import type {
  AcademicYearRecord,
  ClassRecord,
  StudentRecord,
  ProjectRecord,
} from "@/common/types";
import {
  SearchOutlined,
  UserOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useNotification } from "@refinedev/core";
import { toErrorMessage } from "@/common/helpers/error";

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  project: ProjectRecord | null;
  currentStudentName?: string;
  currentClassName?: string;
  years: AcademicYearRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  onCancel: () => void;
  onSubmit: (payload: {
    documentId: string;
    toStudentDocId: string;
  }) => Promise<void>;
};

const pickActiveYearDocId = (years: AcademicYearRecord[]) => {
  const active = years.find((y) => y.academic_status === "active")?.documentId;
  return active ?? years[0]?.documentId ?? "";
};

export const MoveProjectModal: React.FC<Props> = ({
  open,
  project,
  currentStudentName,
  currentClassName,
  years,
  classes,
  students,
  onCancel,
  onSubmit,
}) => {
  const { modal } = App.useApp();
  const { open: notify } = useNotification();

  const [yearDocId, setYearDocId] = useState<string>("");
  const [classDocId, setClassDocId] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [selectedStudentDocId, setSelectedStudentDocId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const activeYearDocId = useMemo(() => pickActiveYearDocId(years), [years]);

  useEffect(() => {
    if (!open) return;
    setYearDocId(activeYearDocId);
    setClassDocId("");
    setSelectedStudentDocId("");
    setQ("");
  }, [open, activeYearDocId]);

  const yearOptions = useMemo(
    () =>
      years.map((y) => ({
        label: y.name ?? "-",
        value: y.documentId,
      })),
    [years],
  );

  const classesInYear = useMemo(() => {
    if (!yearDocId) return [];
    return classes.filter((c) => c.academic_year?.documentId === yearDocId);
  }, [classes, yearDocId]);

  const classOptions = useMemo(
    () =>
      classesInYear.map((c) => ({
        label: c.name ?? "-",
        value: c.documentId,
      })),
    [classesInYear],
  );

  useEffect(() => {
    if (!open) return;
    setClassDocId("");
    setSelectedStudentDocId("");
    setQ("");
  }, [open]);

  const studentsInClass = useMemo(() => {
    if (!classDocId) return [];
    return students.filter((s) => s.class?.documentId === classDocId);
  }, [students, classDocId]);

  const filteredStudents = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return studentsInClass;

    return studentsInClass.filter((s) => {
      const name = (s.name ?? "").toLowerCase();
      const cls = (s.class?.name ?? "").toLowerCase();
      return name.includes(keyword) || cls.includes(keyword);
    });
  }, [studentsInClass, q]);

  const canSubmit =
    !!project?.documentId && !!selectedStudentDocId && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!project?.documentId) return;
    if (!selectedStudentDocId) return;

    modal.confirm({
      centered: true,
      title: "移動の確認",
      content: (
        <div>
          <Text>
            選択した生徒のフォルダへ作品を移動します。よろしいですか？
          </Text>
        </div>
      ),
      okText: "移動する",
      cancelText: "キャンセル",
      onOk: async () => {
        setSubmitting(true);
        try {
          await onSubmit({
            documentId: project.documentId,
            toStudentDocId: selectedStudentDocId,
          });

          notify?.({ type: "success", message: "移動しました" });
        } catch (e: unknown) {
          notify?.({
            type: "error",
            message: "移動に失敗しました",
            description: toErrorMessage(e, "移動に失敗しました"),
          });

          throw e;
        } finally {
          setSubmitting(false);
        }
      },
    });
  }, [modal, onSubmit, project?.documentId, selectedStudentDocId, notify]);

  const headerStudentLine = useMemo(() => {
    const author = currentStudentName ?? "-";
    const cls = currentClassName ? `・${currentClassName}` : "";
    return `作者: ${author}${cls}`;
  }, [currentStudentName, currentClassName]);
  const thumbUrl = project?.thumbnail?.url ?? undefined;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      width={520}
      title={
        <Title level={5} style={{ margin: 0 }}>
          作品の移動
        </Title>
      }
      footer={
        <Flex gap={10} justify='end'>
          <Button onClick={onCancel} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            type='primary'
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}>
            移動する
          </Button>
        </Flex>
      }
      destroyOnHidden
      className='thinScroll'
      styles={{
        body: {
          maxHeight: "70vh",
          overflow: "auto",
        },
      }}>
      <div style={{ background: "#F5F8FF", padding: 12, borderRadius: 8 }}>
        <Flex gap={10} align='flex-start'>
          <div
            style={{
              height: 180,
              borderRadius: 6,
              overflow: "hidden",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt='thumb'
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <PictureOutlined />
            )}
          </div>

          <div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              対象
            </Text>
            <div style={{ fontWeight: 600 }}>{project?.title ?? "-"}</div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {headerStudentLine}
            </Text>
          </div>
        </Flex>
      </div>

      <Divider style={{ margin: "14px 0" }} />

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <Text strong>1. 移動先の年度</Text>
          <Select
            style={{ width: "100%", marginTop: 6 }}
            placeholder='年度を選択'
            options={yearOptions}
            value={activeYearDocId || undefined}
            disabled
          />
        </div>

        <div>
          <Text strong>2. 移動先のクラス</Text>
          <Select
            style={{ width: "100%", marginTop: 6 }}
            placeholder='移動先のクラスを選択'
            options={classOptions}
            value={classDocId || undefined}
            onChange={(v) => {
              setClassDocId(v);
              setSelectedStudentDocId("");
              setQ("");
            }}
            disabled={!yearDocId || submitting}
          />
        </div>

        <div>
          <Text strong>3. 生徒を選択</Text>

          <Input
            style={{ marginTop: 6 }}
            placeholder='生徒名で検索...'
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={!classDocId || submitting}
            allowClear
          />

          <div
            className='hideScroll'
            style={{
              marginTop: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 8,
              maxHeight: 220,
              overflow: "auto",
            }}>
            <List
              dataSource={filteredStudents}
              locale={{
                emptyText: classDocId
                  ? "生徒がありません"
                  : "クラスを選択してください",
              }}
              renderItem={(s) => {
                const selected = s.documentId === selectedStudentDocId;
                return (
                  <List.Item
                    style={{
                      cursor: "pointer",
                      padding: "10px 12px",
                      background: selected ? "#E6F4FF" : undefined,
                    }}
                    onClick={() => setSelectedStudentDocId(s.documentId)}>
                    <Flex align='center' gap={10} style={{ width: "100%" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: selected ? "#1677FF" : "rgba(0,0,0,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: selected ? "#fff" : "rgba(0,0,0,0.45)",
                          flex: "0 0 28px",
                        }}>
                        <UserOutlined />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{s.name ?? "-"}</div>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                          {s.class?.name ?? "-"}
                        </Text>
                      </div>
                    </Flex>
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      </div>

      <Divider style={{ margin: "14px 0" }} />

      <Alert
        type='warning'
        showIcon
        message={
          <div>
            <div>
              注意：作品は選択した生徒のフォルダへ移動され、元のフォルダからは削除されます。
            </div>
          </div>
        }
      />
    </Modal>
  );
};
