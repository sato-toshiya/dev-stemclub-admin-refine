import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Col, Empty, Row, Spin, Typography } from "antd";
import { FolderIcon } from "@/common/icons";

const { Text } = Typography;

export type FolderItem = {
  key: string;
  title: string;
  subtitle?: string;
};

export const FolderGrid = ({
  items,
  emptyText,
  onClick,
  renderItemAction,
  listKey,
  infinite,
  loading,
}: {
  items: FolderItem[];
  emptyText: string;
  onClick: (nodeKey: string) => void;
  renderItemAction?: (item: FolderItem) => ReactNode;
  listKey?: string;
  infinite?: { enabled?: boolean; step?: number };
  loading?: boolean;
}) => {
  const enabled = infinite?.enabled ?? false;
  const step = infinite?.step ?? 24;

  const [limit, setLimit] = useState<number>(enabled ? step : items.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLimit(items.length);
      return;
    }
    setLimit(step);
  }, [enabled, step, listKey, items]);

  const visibleItems = useMemo(() => {
    if (!enabled) return items;
    return items.slice(0, limit);
  }, [enabled, items, limit]);

  const hasMore = enabled ? limit < items.length : false;

  useEffect(() => {
    if (!enabled) return;
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const ob = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loadingMore) return;
        setLoadingMore(true);
        setLimit((prev) => Math.min(prev + step, items.length));
        window.setTimeout(() => setLoadingMore(false), 250);
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      },
    );

    ob.observe(node);
    return () => ob.disconnect();
  }, [enabled, hasMore, items.length, step, loadingMore]);

  if (loading) {
    return (
      <div
        style={{
          marginTop: 40,
          minHeight: 180,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Spin />
      </div>
    );
  }

  if (items.length === 0) {
    return <Empty description={emptyText} style={{ marginTop: 60 }} />;
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {visibleItems.map((it) => (
          <Col key={it.key} xs={24} sm={12} lg={8} xl={8} xxl={8}>
            <div
              role='button'
              tabIndex={0}
              onClick={() => onClick(it.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClick(it.key);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.04)",
                cursor: "pointer",
                userSelect: "none",
                minHeight: 64,
              }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "rgba(24,144,255,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 44px",
                }}>
                <FolderIcon />
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                }}>
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    lineHeight: "18px",
                    marginBottom: 2,
                  }}
                  ellipsis>
                  {it.title}
                </Text>

                {it.subtitle ? (
                  <Text
                    type='secondary'
                    style={{ fontSize: 12, lineHeight: "16px" }}
                    ellipsis>
                    {it.subtitle}
                  </Text>
                ) : null}
              </div>

              {renderItemAction ? renderItemAction(it) : null}
            </div>
          </Col>
        ))}
      </Row>

      {enabled ? (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 32,
          }}>
          {hasMore ? (
            <>
              <div ref={sentinelRef} style={{ height: 1 }} />
              <Spin spinning={loadingMore} />
            </>
          ) : (
            <Text type='secondary' style={{ fontSize: 12 }}>
              {items.length > 0 ? "全て表示しました" : ""}
            </Text>
          )}
        </div>
      ) : null}
    </>
  );
};
