import React, { useCallback } from "react";
import type { ModalFuncProps } from "antd/es/modal";
import type { DefaultOptionType } from "antd/es/select";

import { getErrorMessage } from "@/common/helpers/error";
import { axiosInstance } from "@/provider/authProvider";
import { DeleteManyParams, OpenNotificationParams } from "@refinedev/core";

type ModalConfirm = (config: ModalFuncProps) => void;

type InvalidateFn = (params: {
  resource: string;
  invalidates: Array<"list" | "many" | "detail" | "all">;
}) => Promise<unknown>;

type DownloadPdfFn = (url: string, filename: string) => Promise<void>;

async function downloadPdfAxios(url: string, filename: string) {
  const res = await axiosInstance.get(url, { responseType: "blob" });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const href = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(href);
}

type NotifyFn = (params: OpenNotificationParams) => void;

type DeleteManyFn = (params: DeleteManyParams<object>) => Promise<unknown>;

type Params = {
  modalConfirm: ModalConfirm;
  notify: NotifyFn;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  deleteMany: DeleteManyFn;
  invalidate: InvalidateFn;
  q: string;
  classDocId?: string;
  academicYearDocId?: string;
  applyFilters: (
    nextQ: string,
    nextClassDocId?: string,
    nextAcademicYearDocId?: string,
  ) => void;
  classOptions?: DefaultOptionType[];
  downloadPdf?: DownloadPdfFn;
};

export const useStudentListActions = ({
  modalConfirm,
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
  downloadPdf = downloadPdfAxios,
}: Params) => {
  const onExportQrPdf = useCallback(() => {
    const isAll = !classDocId;
    const className =
      classOptions?.find((o) => o.value === classDocId)?.label ?? classDocId;

    const scopeText = isAll
      ? "全生徒（全クラス）"
      : `クラス「${String(className)}」`;

    modalConfirm({
      title: "QR PDFを出力しますか？",
      centered: true,
      getContainer: () => document.body,
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            {isAll
              ? "全クラスの生徒QRをPDFに出力します。"
              : `${scopeText} の生徒QRをPDFに出力します。`}
          </div>
          <div style={{ color: "rgba(0,0,0,0.45)" }}>
            出力には少し時間がかかる場合があります。
          </div>
        </div>
      ),
      okText: "出力する",
      cancelText: "キャンセル",
      okButtonProps: { type: "primary" },
      onOk: async () => {
        try {
          const path = "/students/export-qr-pdf";
          const url = classDocId
            ? `${path}?class=${encodeURIComponent(classDocId)}`
            : path;

          const filename = classDocId
            ? `students_qr_${classDocId}.pdf`
            : "students_qr_all.pdf";

          await downloadPdf(url, filename);

          notify({
            type: "success",
            message: "PDFを出力しました",
            description: "PDFのダウンロードを開始しました。",
          });
        } catch (e: unknown) {
          notify({
            type: "error",
            message: "PDFの出力に失敗しました",
            description: getErrorMessage(e, "PDFの出力に失敗しました"),
          });
        }
      },
    });
  }, [classDocId, classOptions, downloadPdf, notify, modalConfirm]);

  const onBulkDelete = useCallback(() => {
    if (!selectedRowKeys.length) {
      notify({
        type: "progress",
        message: "削除する生徒を選択してください",
      });
      return;
    }

    modalConfirm({
      title: "選択した生徒を削除しますか？",
      centered: true,
      getContainer: () => document.body,
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            {selectedRowKeys.length}件の生徒を削除します。元に戻せません。
          </div>
        </div>
      ),
      okText: "削除する",
      okButtonProps: { danger: true },
      cancelText: "キャンセル",
      onOk: async () => {
        try {
          await deleteMany({
            resource: "students",
            ids: selectedRowKeys.map(String),
          });

          setSelectedRowKeys([]);

          await invalidate({
            resource: "students",
            invalidates: ["list"],
          });

          applyFilters(q, classDocId, academicYearDocId);
        } catch (e: unknown) {
          console.error("bulk delete failed", e);
          throw e;
        }
      },
    });
  }, [
    selectedRowKeys,
    notify,
    modalConfirm,
    deleteMany,
    setSelectedRowKeys,
    invalidate,
    applyFilters,
    q,
    classDocId,
    academicYearDocId,
  ]);

  return { onExportQrPdf, onBulkDelete };
};
