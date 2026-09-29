export interface RoleDTO {
  roleName: string;
  privileges: string[];
}

export interface CreateRoleRequest {
  roleName: string;
  privileges: string[];
}

export interface AssignRolesRequest {
  roles: string[];
}

export interface UserRolesResponse {
  userId: string;
  roles: string[];
}
