import React, { useCallback } from "react";
import type { ModalFuncProps } from "antd/es/modal";
import type { DefaultOptionType } from "antd/es/select";
import type { OpenNotificationParams } from "@refinedev/core";

import { getErrorMessage } from "@/common/helpers/error";

type ModalConfirm = (config: ModalFuncProps) => void;

type InvalidateFn = (params: {
  resource: string;
  invalidates: Array<"list" | "many" | "detail" | "all">;
}) => Promise<unknown>;

type DeleteManyFn = (params: {
  resource: string;
  ids: string[];
}) => Promise<unknown>;

type NotifyFn = (params: OpenNotificationParams) => void;

type Params = {
  modalConfirm: ModalConfirm;
  notify: NotifyFn;

  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;

  deleteMany: DeleteManyFn;
  deletingMany: boolean;
  invalidate: InvalidateFn;

  q: string;
  classDocId?: string;
  academicYearDocId?: string;
  applyFilters: (
    nextQ: string,
    nextClassDocId?: string,
    nextAcademicYearDocId?: string,
    blocked?: boolean,
  ) => void;

  classOptions?: DefaultOptionType[];
};

export const useTeacherListActions = ({
  modalConfirm,
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
}: Params) => {
  const onBulkDelete = useCallback(() => {
    const ids = selectedRowKeys.map(String).filter(Boolean);
    if (!ids.length) {
      notify({ type: "error", message: "削除する教師を選択してください" });
      return;
    }

    modalConfirm({
      title: "選択した教師を削除しますか？",
      centered: true,
      okText: "削除する",
      cancelText: "キャンセル",
      okButtonProps: { danger: true, loading: deletingMany },
      onOk: async () => {
        try {
          await deleteMany({ resource: "teachers", ids });
          setSelectedRowKeys([]);

          await invalidate({
            resource: "teachers",
            invalidates: ["list"],
          });

          applyFilters(q, classDocId, academicYearDocId);
        } catch (e: unknown) {
          notify({
            type: "error",
            message: "一括削除に失敗しました",
            description: getErrorMessage(e, "一括削除に失敗しました"),
          });
          throw e;
        }
      },
    });
  }, [
    applyFilters,
    classDocId,
    academicYearDocId,
    deleteMany,
    deletingMany,
    invalidate,
    modalConfirm,
    notify,
    q,
    selectedRowKeys,
    setSelectedRowKeys,
  ]);

  return { onBulkDelete };
};
