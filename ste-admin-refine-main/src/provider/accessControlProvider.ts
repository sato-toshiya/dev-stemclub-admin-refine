import type { AccessControlProvider, CanParams } from "@refinedev/core";
import { getReadySnapshot, getRoleSnapshot } from "./authStateBridge";

type Permission = {
  resource: string;
  actions: string[];
};

type RolePermissions = {
  [role: string]: Permission[];
};

const rolePermissions: RolePermissions = {
  agency_admin: [
    {
      resource: "school-admins",
      actions: ["list", "create", "edit", "show", "delete"],
    },
    {
      resource: "teachers",
      actions: ["list", "create", "edit", "show", "delete"],
    },
  ],
  school_admin: [
    {
      resource: "academic-years",
      actions: ["list", "create", "edit", "show", "delete"],
    },
    {
      resource: "classes",
      actions: ["list", "create", "edit", "show", "delete"],
    },
    {
      resource: "teachers",
      actions: ["list", "create", "edit", "show", "delete"],
    },
    {
      resource: "students",
      actions: ["list", "create", "edit", "show", "delete"],
    },
    {
      resource: "works",
      actions: ["list", "create", "edit", "show", "delete"],
    },
  ],
};

function checkPermission(
  role: string,
  resource: string,
  action: string,
): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) {
    return false;
  }

  const resourcePermission = permissions.find((p) => p.resource === resource);
  if (!resourcePermission) {
    return false;
  }

  return resourcePermission.actions.includes(action);
}

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }: CanParams) => {
    const ready = getReadySnapshot();
    const role = getRoleSnapshot();

    if (!ready) return { can: true };

    if (!resource) return { can: true };

    if (!role) {
      return { can: false, reason: "No role assigned. Please log in." };
    }

    const normalizedAction = action || "list";
    const can = checkPermission(role, resource, normalizedAction);

    return {
      can,
      reason: can
        ? undefined
        : `Access denied: ${role} cannot ${normalizedAction} ${resource}`,
    };
  },
};
