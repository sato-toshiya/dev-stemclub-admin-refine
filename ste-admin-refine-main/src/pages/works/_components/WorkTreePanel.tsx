import React from "react";
import { Tree } from "antd";
import type { DataNode } from "antd/es/tree";

export const WorkTreePanel = ({
  treeData,
  expandedKeys,
  selectedKey,
  onExpand,
  onSelect,
  autoExpandParent,
}: {
  treeData: DataNode[];
  expandedKeys: string[];
  selectedKey: string | null;
  onExpand: (keys: React.Key[]) => void;
  onSelect: (keys: React.Key[]) => void;
  autoExpandParent?: boolean;
}) => {
  return (
    <div
      style={{
        width: 340,
        background: "#fff",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.06)",
        padding: 16,
      }}>
      <div style={{ marginTop: 14 }}>
        <Tree
          autoExpandParent={autoExpandParent}
          showIcon
          multiple={false}
          treeData={treeData}
          expandedKeys={expandedKeys}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onExpand={onExpand}
          onSelect={onSelect}
          expandAction={false}
        />
      </div>
    </div>
  );
};
