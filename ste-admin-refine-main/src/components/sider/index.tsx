import type { RefineThemedLayoutSiderProps } from "@refinedev/antd";
import { useLogout, useMenu } from "@refinedev/core";
import { Layout, Menu, Spin } from "antd";
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import "./index.css";
import { Role } from "@/auth/roles";
import { useAuthState } from "@/provider/authStateContext";

const { Sider } = Layout;

export const CustomSider: React.FC<RefineThemedLayoutSiderProps> = () => {
  const { role, ready } = useAuthState();
  const { menuItems } = useMenu();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = useMemo(() => {
    if (!ready) return [];

    const allowed = new Set<string>();
    if (role === Role.AgencyAdmin) allowed.add("school-admins");
    if (role === Role.SchoolAdmin) {
      allowed.add("academic-years");
      allowed.add("teachers");
      allowed.add("students");
      allowed.add("works");
    }

    return menuItems.filter((mi) => !mi.name || allowed.has(mi.name));
  }, [menuItems, role, ready]);

  const activeKey = useMemo(() => {
    if (!ready) return undefined;

    const currentPath = location.pathname;
    const matched = visibleItems.find(
      (mi) => mi.route && currentPath.startsWith(String(mi.route)),
    );
    return matched?.key ? String(matched.key) : undefined;
  }, [location.pathname, visibleItems, ready]);

  return (
    <Sider
      width={220}
      style={{
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
      }}>
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontWeight: 600,
          fontSize: 18,
        }}>
        すてむくらぶ管理画面
      </div>

      {!ready ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Spin />
        </div>
      ) : (
        <>
          <Menu
            mode='inline'
            theme='light'
            rootClassName='custom-sider-menu'
            style={{ padding: "12px 8px", borderRight: "none", flex: 1 }}
            selectedKeys={activeKey ? [activeKey] : []}
            onClick={(info) => {
              const item = visibleItems.find(
                (mi) => String(mi.key) === String(info.key),
              );
              if (item?.route) navigate(item.route);
            }}>
            {visibleItems.map((mi) => (
              <Menu.Item key={String(mi.key)} icon={mi.icon}>
                {mi.label ?? mi.name}
              </Menu.Item>
            ))}
          </Menu>

          <Menu
            mode='inline'
            selectable={false}
            theme='light'
            rootClassName='custom-sider-menu'
            style={{ padding: "0 8px 12px", borderRight: "none" }}
            onClick={(info) => info.key === "logout" && logout()}>
            <Menu.Item key='logout'>Logout</Menu.Item>
          </Menu>
        </>
      )}
    </Sider>
  );
};
