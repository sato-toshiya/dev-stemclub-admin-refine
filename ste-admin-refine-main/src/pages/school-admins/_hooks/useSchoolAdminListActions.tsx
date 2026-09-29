import React, { useCallback } from "react";
import type { ModalFuncProps } from "antd/es/modal";
import { DeleteManyParams, OpenNotificationParams } from "@refinedev/core";
import { StatusFilter } from "./useSchoolAdminFilters";

type ModalConfirm = (config: ModalFuncProps) => void;

type InvalidateFn = (params: {
  resource: string;
  invalidates: Array<"list" | "many" | "detail" | "all">;
}) => Promise<unknown>;

type NotifyFn = (params: OpenNotificationParams) => void;
type DeleteManyFn = (params: DeleteManyParams<object>) => Promise<unknown>;

type Params = {
  modalConfirm: ModalConfirm;
  notify: NotifyFn;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  deleteMany: DeleteManyFn;
  deletingMany: boolean;
  invalidate: InvalidateFn;
  q: string;
  status: StatusFilter;
  applyFilters: (nextQ: string, nextStatus: StatusFilter) => void;
};

export const useSchoolAdminListActions = ({
  modalConfirm,
  notify,
  selectedRowKeys,
  setSelectedRowKeys,
  deleteMany,
  deletingMany,
  invalidate,
  q,
  status,
  applyFilters,
}: Params) => {
  const onBulkDelete = useCallback(() => {
    if (!selectedRowKeys.length) {
      notify({
        type: "progress",
        message: "削除する法人を選択してください",
      });
      return;
    }

    modalConfirm({
      title: "選択した法人を削除しますか？",
      centered: true,
      getContainer: () => document.body,
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            {selectedRowKeys.length}件の法人を削除します。元に戻せません。
          </div>
        </div>
      ),
      okText: "削除する",
      okButtonProps: { danger: true, loading: deletingMany },
      cancelText: "キャンセル",
      onOk: async () => {
        await deleteMany({
          resource: "school-admins",
          ids: selectedRowKeys.map(String),
        });

        setSelectedRowKeys([]);

        await invalidate({
          resource: "school-admins",
          invalidates: ["list"],
        });

        applyFilters(q, status);
      },
    });
  }, [
    selectedRowKeys,
    notify,
    modalConfirm,
    deleteMany,
    deletingMany,
    setSelectedRowKeys,
    invalidate,
    applyFilters,
    q,
    status,
  ]);

  return { onBulkDelete };
};
