export type SchoolAdminUserLite = {
  email?: string;
  phone?: string;
  blocked?: boolean;
};

export type SchoolAdminRecord = {
  id?: number;
  documentId?: string;

  name?: string;
  representor?: string;
  address?: string;

  updatedAt?: string;

  users_permissions_users?: SchoolAdminUserLite[];
};
