import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Modal,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  LinkOutlined,
} from "@ant-design/icons";
import { useNotification } from "@refinedev/core";

import { fmtDateJa, fmtDateJaWithDay, toMBText } from "@/common/utils";
import { ProjectRecord } from "@/common/types";
import { isDuplicateTitleError, toErrorMessage } from "@/common/helpers/error";

const { Text, Title } = Typography;

const guessExtension = (url?: string | null) => {
  if (!url) return "-";
  const clean = url.split("?")[0] ?? "";
  const seg = clean.split(".").pop();
  return seg ? seg.toUpperCase() : "-";
};

const makeUniqueTitle = (raw: string, existing: string[]) => {
  const base = raw.replace(/_\d+$/, "");
  const set = new Set(existing.map((s) => s.trim()));
  if (!set.has(raw.trim())) return raw.trim();

  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}_${i}`;
    if (!set.has(candidate)) return candidate;
  }
  return `${base}_${Date.now()}`;
};

type WorkPreviewModalProps = {
  open: boolean;
  project: ProjectRecord | null;
  onClose: () => void;
  onConfirmRename: (payload: {
    documentId: string;
    title: string;
  }) => Promise<void> | void;
  onDelete: (documentId: string) => Promise<void> | void;
  onMove: () => void;
  studentName: string;
  downloadUrl?: string;
  existingTitles?: string[];

  onShare: (project: ProjectRecord) => Promise<string> | string;
};

export const WorkPreviewModal = ({
  open,
  project,
  onClose,
  onConfirmRename,
  onDelete,
  onMove,
  studentName,
  downloadUrl,
  existingTitles = [],
  onShare,
}: WorkPreviewModalProps) => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const { open: notify } = useNotification();

  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitleDraft(project?.title ?? "");
  }, [open, project?.documentId, project?.title]);

  const coverUrl = project?.thumbnail?.url ?? undefined;

  const meta = useMemo(() => {
    return {
      fileSize: toMBText(project?.file_size),
      classDate: fmtDateJaWithDay(project?.createdAt),
      template: "海の世界テンプレート",
      extension: guessExtension(coverUrl ?? downloadUrl ?? null),
    };
  }, [project?.file_size, project?.createdAt, coverUrl, downloadUrl]);

  const downloadFile = async (url: string, filename?: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("ダウンロードに失敗しました");

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename ?? "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!downloadUrl) {
      notify?.({ type: "progress", message: "ダウンロードURLがありません" });
      return;
    }

    try {
      const nameFromUrl =
        downloadUrl.split("?")[0]?.split("/").pop() ?? undefined;
      await downloadFile(downloadUrl, nameFromUrl);
    } catch (e: unknown) {
      notify?.({
        type: "error",
        message: "ダウンロードに失敗しました",
        description: toErrorMessage(e, "ダウンロードに失敗しました"),
      });
    }
  }, [downloadUrl, notify]);

  const handleDelete = useCallback(() => {
    if (!project?.documentId) return;
    const title = project.title ?? "-";
    const classDate = fmtDateJa(project.createdAt);

    modal.confirm({
      title: "削除の確認",
      centered: true,
      icon: <ExclamationCircleFilled style={{ color: "#ff4d4f" }} />,
      okText: "削除",
      okType: "danger",
      okButtonProps: { icon: <DeleteOutlined /> },
      cancelText: "キャンセル",
      content: (
        <Flex vertical align='center' gap={6} style={{ marginTop: 8 }}>
          <Text>以下の作品を削除しますか。</Text>
          <Text strong>{title}</Text>
          <Text strong>作成者: {studentName ?? "-"}</Text>
          <Text strong>授業日: {classDate}</Text>
        </Flex>
      ),
      onOk: async () => {
        try {
          await onDelete(project.documentId);
          notify?.({
            type: "success",
            message: "削除しました",
            description: "作品を削除しました。",
          });
          onClose();
        } catch (e: unknown) {
          notify?.({
            type: "error",
            message: "削除に失敗しました",
            description: toErrorMessage(e, "削除に失敗しました"),
          });
        }
      },
    });
  }, [modal, project, onDelete, notify, onClose, studentName]);

  const handleShare = useCallback(async () => {
    if (!project?.documentId) return;
    try {
      const link = (await onShare(project)).trim();
      if (!link) throw new Error("共有リンクの作成に失敗しました");
      await navigator.clipboard.writeText(link);
      notify?.({
        type: "success",
        message: "共有リンクをコピーしました",
        description: "クリップボードにコピーしました。",
      });
    } catch (e: unknown) {
      notify?.({
        type: "error",
        message: "共有リンクの作成に失敗しました",
        description: toErrorMessage(e, "共有リンクの作成に失敗しました"),
      });
    }
  }, [project, onShare, notify]);

  const handleConfirm = useCallback(async () => {
    if (!project?.documentId) return;
    const next = titleDraft.trim();
    if (!next) {
      notify?.({ type: "error", message: "新しい作品名を入力してください。" });
      return;
    }

    const doRename = async (title: string) => {
      await onConfirmRename({ documentId: project.documentId, title });
      notify?.({ type: "success", message: "保存しました" });
      onClose();
    };

    try {
      await doRename(next);
    } catch (e: unknown) {
      if (!isDuplicateTitleError(e)) {
        notify?.({
          type: "error",
          message: "保存に失敗しました",
          description: toErrorMessage(e, "保存に失敗しました"),
        });
        return;
      }
      const titles = existingTitles.filter((t) => t !== (project.title ?? ""));
      const auto = makeUniqueTitle(next, titles);

      modal.confirm({
        title: "作品名が既に存在します",
        content: `「${auto}」に自動で変更しますか？`,
        okText: "確認",
        cancelText: "キャンセル",
        centered: true,
        onOk: async () => {
          await doRename(auto);
          notify?.({
            type: "success",
            message: `保存しました: ${auto}`,
            description: "作品名を保存しました。",
          });
        },
      });
    }
  }, [
    project?.documentId,
    project?.title,
    titleDraft,
    existingTitles,
    onConfirmRename,
    onClose,
    notify,
    modal,
  ]);

  const handleMove = useCallback(() => {
    if (!project?.documentId) return;
    onMove();
  }, [onMove, project?.documentId]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={980}
      destroyOnHidden
      footer={
        <Flex justify='space-between' align='center'>
          <Button onClick={onClose}>キャンセル</Button>

          <Flex gap={8}>
            <Button
              icon={<LinkOutlined />}
              onClick={handleShare}
              disabled={!project?.documentId}>
              共有リンク
            </Button>
            <Button onClick={handleMove} disabled={!project?.documentId}>
              移動
            </Button>

            <Button
              type='primary'
              onClick={handleConfirm}
              disabled={!project?.documentId}>
              確認
            </Button>
          </Flex>
        </Flex>
      }
      title={
        <Flex align='center' gap={8}>
          <Button type='text' icon={<ArrowLeftOutlined />} onClick={onClose} />
          <Title level={5} style={{ margin: 0 }}>
            作品詳細
          </Title>
        </Flex>
      }>
      <Flex gap={20}>
        <div style={{ flex: "0 0 520px" }}>
          <Card
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: token.borderRadiusLG,
              overflow: "hidden",
            }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 10",
                  background: token.colorFillTertiary,
                }}>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt='thumb'
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Flex
                    align='center'
                    justify='center'
                    style={{ width: "100%", height: "100%" }}>
                    <Text type='secondary'>No Thumbnail</Text>
                  </Flex>
                )}
              </div>

              <Flex
                gap={8}
                style={{ position: "absolute", top: 10, right: 10 }}>
                <Tooltip title='削除'>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    disabled={!project?.documentId}
                  />
                </Tooltip>

                <Tooltip title='ダウンロード'>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!downloadUrl}
                  />
                </Tooltip>
              </Flex>
            </div>
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card
            size='small'
            style={{ marginBottom: 16, borderRadius: token.borderRadiusLG }}
            styles={{ body: { background: token.colorFillQuaternary } }}>
            <Descriptions
              size='small'
              layout='vertical'
              column={2}
              labelStyle={{ fontWeight: 700, color: token.colorTextSecondary }}>
              <Descriptions.Item label='ファイルサイズ'>
                {meta.fileSize}
              </Descriptions.Item>
              <Descriptions.Item label='授業日'>
                {meta.classDate}
              </Descriptions.Item>
              <Descriptions.Item label='テンプレート'>
                {meta.template}
              </Descriptions.Item>
              <Descriptions.Item label='EXTENSION'>
                {meta.extension}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Flex vertical gap={12}>
            <div>
              <Text strong>作品名</Text>
              <Input
                value={project?.title ?? ""}
                readOnly
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <Text strong>作品名の変更</Text>
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder='新しい作品名を入力してください。'
                style={{ marginTop: 6 }}
                disabled={!project?.documentId}
              />
            </div>

            <Text type='secondary' style={{ fontSize: 12 }}>
              作品名のみ変更されます。作品の内容は変更されません。
            </Text>
          </Flex>
        </div>
      </Flex>
    </Modal>
  );
};
