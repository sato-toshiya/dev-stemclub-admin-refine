import { useCallback } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { parseNodeKey } from "@/common/utils";

type NodeType = "year" | "class" | "student" | "day" | null;

const getTypeOfNode = (node: string | null): NodeType => {
  if (!node) return null;
  return parseNodeKey(node).type as NodeType;
};

export const useWorkNavigation = ({
  selectedNodeKey,
  classDay,
  setClassDay,
  setClassMonth,
  setRange,
  setSelectedNodeKey,
  resetPage,
}: {
  selectedNodeKey: string | null;
  classDay: Dayjs;
  setClassDay: (d: Dayjs) => void;
  setClassMonth: (d: Dayjs) => void;
  setRange: (v: [Dayjs | null, Dayjs | null]) => void;
  setSelectedNodeKey: (v: string | null) => void;
  resetPage: () => void;
}) => {
  const clearRangeFromUrlAndState = (sp: URLSearchParams) => {
    sp.delete("from");
    sp.delete("to");
    setRange([null, null]);
  };

  const setRangeToUrlAndState = (
    sp: URLSearchParams,
    from: Dayjs,
    to: Dayjs,
  ) => {
    setRange([from, to]);
    sp.set("from", from.toISOString());
    sp.set("to", to.toISOString());
  };

  const navigateToNode = useCallback(
    (nextNode: string | null) => {
      const sp = new URLSearchParams(window.location.search);

      const prevType = getTypeOfNode(selectedNodeKey);
      const nextType = getTypeOfNode(nextNode);

      if (!nextNode) sp.delete("node");
      else sp.set("node", nextNode);

      if (nextType === "student" && nextNode) {
        const { docId } = parseNodeKey(nextNode);
        sp.set("student", docId);
      } else {
        sp.delete("student");
      }

      if (prevType === "day" && nextType !== "day") {
        clearRangeFromUrlAndState(sp);
      }

      if (nextType === "year" || nextType === "class" || nextType === null) {
        clearRangeFromUrlAndState(sp);
      }

      if (nextType === "day" && nextNode) {
        const parsed = parseNodeKey(nextNode);
        if (parsed.type === "day") {
          const d = dayjs(parsed.date);
          if (d.isValid()) {
            setClassDay(d);

            const m = d.startOf("month");
            setClassMonth(m);
            sp.set("month", d.format("YYYY-MM"));

            const from = d.startOf("day");
            const to = d.endOf("day");
            setRangeToUrlAndState(sp, from, to);
          } else {
            clearRangeFromUrlAndState(sp);
          }
        }
      }

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${sp.toString()}`,
      );

      setSelectedNodeKey(nextNode);
      resetPage();
    },
    [
      selectedNodeKey,
      classDay,
      resetPage,
      setSelectedNodeKey,
      setRange,
      setClassDay,
      setClassMonth,
    ],
  );

  return { navigateToNode };
};
