import { useAuthState } from "@/provider/authStateContext";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { Layout as AntdLayout, Space, theme, Typography } from "antd";
import React from "react";

const { Text } = Typography;
const { useToken } = theme;

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { identity, ready } = useAuthState();
  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }
  const name = identity?.school_admin?.name;

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Space style={{ marginLeft: "8px" }} size='middle'>
          {ready && name ? <Text strong>{name}</Text> : null}
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
