export interface RoleDTO {
  id?: string;
  roleName: string;
  description?: string;
  privileges: string[];
}

export interface CreateRoleRequest {
  roleName: string;
  description?: string;
  privileges: string[];
}

export type UpdateRoleRequest = CreateRoleRequest;

export interface AssignRolesRequest {
  roles: string[];
}

export interface UserRolesResponse {
  userId: string;
  roles: string[];
}
