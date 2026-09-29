import { App } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useMemo, useState } from "react";
import type { OpenNotificationParams } from "@refinedev/core";

import { getErrorMessage } from "@/common/helpers/error";
import { axiosInstance } from "@/provider/authProvider";
import type { ImportResult } from "../types";

type NotifyFn = (params: OpenNotificationParams) => void;

export type StudentImportTarget = {
  academicYearDocumentId: string;
  classDocumentId: string;
  academicYearLabel: string;
  classLabel: string;
};

type UseStudentImportOptions = {
  notify: NotifyFn;
  modal: ReturnType<typeof App.useApp>["modal"];
  onSuccess?: () => void | Promise<void>;
};

export const useStudentImport = ({
  notify,
  modal,
  onSuccess,
}: UseStudentImportOptions) => {
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [importTarget, setImportTarget] = useState<StudentImportTarget | null>(
    null,
  );

  const openImportModal = useCallback((target?: StudentImportTarget | null) => {
    setImportTarget(target ?? null);
    setImportFileList([]);
    setImportOpen(true);
  }, []);

  const closeImportModal = useCallback(() => {
    if (importing) return;
    setImportOpen(false);
    setImportTarget(null);
  }, [importing]);

  const onImportFileChange = useCallback(
    (info: UploadChangeParam<UploadFile>) => {
      setImportFileList(info.fileList.slice(-1));
    },
    [],
  );

  const clearImportFile = useCallback(() => {
    setImportFileList([]);
  }, []);

  const importTargetSummary = useMemo(() => {
    if (!importTarget) return "取り込み先: 未指定（クラス未所属で登録）";
    return `取り込み先: ${importTarget.classLabel}（クラス年度: ${importTarget.academicYearLabel}）`;
  }, [importTarget]);

  const onDoImport = useCallback(async () => {
    const fileObj = importFileList[0]?.originFileObj;
    if (!fileObj) {
      notify({ type: "progress", message: "ファイルを選択してください。" });
      return;
    }

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", fileObj);
      if (importTarget) {
        fd.append(
          "target_academic_year_document_id",
          importTarget.academicYearDocumentId,
        );
        fd.append("target_class_document_id", importTarget.classDocumentId);
      }

      const res = await axiosInstance.post<{ data: ImportResult }>(
        "/students/import",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          params: importTarget
            ? {
                target_academic_year_document_id:
                  importTarget.academicYearDocumentId,
                target_class_document_id: importTarget.classDocumentId,
              }
            : undefined,
        },
      );

      const data = res.data?.data;
      const created = data?.created ?? 0;
      const failed = data?.failed ?? 0;
      const errors = data?.errors ?? [];

      setImportOpen(false);
      setImportFileList([]);
      setImportTarget(null);

      modal.info({
        title: "インポート結果",
        centered: true,
        width: 640,
        content: (
          <div>
            <div style={{ marginBottom: 8 }}>
              <b>作成:</b> {created} / <b>失敗:</b> {failed}
            </div>

            {errors.length ? (
              <div style={{ maxHeight: 260, overflow: "auto" }}>
                <div style={{ marginBottom: 6, color: "rgba(0,0,0,0.65)" }}>
                  失敗した行:
                </div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {errors.slice(0, 200).map((e, idx) => (
                    <li key={`${e.row}-${idx}`}>
                      行 {e.row}: {e.message}
                    </li>
                  ))}
                  {errors.length > 200 ? (
                    <li>…（{errors.length - 200} 件省略）</li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <div style={{ color: "rgba(0,0,0,0.65)" }}>
                すべて正常にインポートされました。
              </div>
            )}
          </div>
        ),
      });

      notify({
        type: "success",
        message: "インポートが完了しました",
        description: `作成: ${created} / 失敗: ${failed}`,
      });

      await onSuccess?.();
    } catch (e: unknown) {
      notify({
        type: "error",
        message: "インポートに失敗しました",
        description: getErrorMessage(e, "インポートに失敗しました"),
      });
    } finally {
      setImporting(false);
    }
  }, [importFileList, importTarget, notify, modal, onSuccess]);

  return {
    importOpen,
    importing,
    importFileList,
    setImportFileList,
    importTarget,
    importTargetSummary,
    openImportModal,
    closeImportModal,
    onImportFileChange,
    clearImportFile,
    onDoImport,
  };
};
