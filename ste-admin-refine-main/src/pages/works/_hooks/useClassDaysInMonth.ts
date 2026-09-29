import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useDataProvider, useNotification } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import { getErrorMessage } from "@/common/helpers/error";

type DayCount = { day: string; count: number };

export const useClassDaysInMonth = ({
  enabled,
  classDocId,
  month,
}: {
  enabled: boolean;
  classDocId?: string;
  month: Dayjs;
}) => {
  const getDataProvider = useDataProvider();
  const dataProvider = getDataProvider() as Required<DataProvider>;

  const monthKey = useMemo(() => month.format("YYYY-MM"), [month]);

  const [data, setData] = useState<DayCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { open: notify } = useNotification();

  const refetch = useCallback(async () => {
    if (!enabled || !classDocId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await dataProvider.custom({
        url: `${dataProvider.getApiUrl()}/projects/by-class-days`,
        method: "get",
        query: {
          class: classDocId,
          month: monthKey,
        },
      });

      const rows = Array.isArray(res?.data) ? (res.data as DayCount[]) : [];
      setData(
        rows
          .map((r) => ({
            day: String(r?.day ?? ""),
            count: Number(r?.count ?? 0),
          }))
          .filter((r) => r.day),
      );
    } catch (e) {
      const desc = getErrorMessage(e, "授業日の取得に失敗しました");
      notify?.({
        type: "error",
        message: "授業日の取得に失敗しました",
        description: desc,
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, classDocId, monthKey, dataProvider]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const parsedDays = useMemo(() => {
    return data
      .map((r) => ({
        ...r,
        dayjs: dayjs(r.day),
      }))
      .filter((r) => r.dayjs.isValid());
  }, [data]);

  return {
    days: parsedDays,
    loading,
    error,
    refetch,
    monthKey,
  };
};
