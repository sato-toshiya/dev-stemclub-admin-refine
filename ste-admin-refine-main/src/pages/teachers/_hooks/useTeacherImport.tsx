import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useState } from "react";

import { getErrorMessage } from "@/common/helpers/error";
import { axiosInstance } from "@/provider/authProvider";
import type { ImportResult } from "../types";
import type { OpenNotificationParams } from "@refinedev/core";

type NotifyFn = (params: OpenNotificationParams) => void;

type Options = {
  modal: Pick<ModalStaticFunctions, "info">;
  notify: NotifyFn;
  onSuccess?: () => void | Promise<void>;
};

export const useTeacherImport = ({ modal, notify, onSuccess }: Options) => {
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);

  const openImportModal = useCallback(() => {
    setImportFileList([]);
    setImportOpen(true);
  }, []);

  const closeImportModal = useCallback(() => {
    if (importing) return;
    setImportOpen(false);
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

  const onDoImport = useCallback(async () => {
    const fileObj = importFileList[0]?.originFileObj;
    if (!fileObj) {
      notify({ type: "error", message: "ファイルを選択してください。" });
      return;
    }

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", fileObj);

      const res = await axiosInstance.post<{ data: ImportResult }>(
        "/teachers/import",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const data = res.data?.data;
      const created = Number(data?.created ?? 0);
      const failed = Number(data?.failed ?? 0);
      const errors = data?.errors ?? [];

      setImportOpen(false);
      setImportFileList([]);

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
        message: `インポート完了: ${created}件`,
        description: failed ? `失敗: ${failed}件` : undefined,
      });

      await onSuccess?.();
    } catch (e: unknown) {
      console.error("Import failed:", e);
      notify({
        type: "error",
        message: "インポートに失敗しました",
        description: getErrorMessage(e, "CSV import failed"),
      });
    } finally {
      setImporting(false);
    }
  }, [importFileList, modal, notify, onSuccess]);

  return {
    importOpen,
    importing,
    importFileList,
    openImportModal,
    closeImportModal,
    onImportFileChange,
    clearImportFile,
    onDoImport,
  };
};
