export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ADMIN' | 'IT_SUPPORT' | 'AGENT' | 'MANAGER' | 'EMPLOYEE' | 'USER';

export interface User {
  id: string;
  displayId?: string;
  email: string;
  fullName: string;
  title?: string;
  profilePictureUrl?: string;
  managerId?: string;
  roles: Role[];
  status?: 'ACTIVE' | 'PENDING';
  departmentId?: string | null;
  departmentName?: string | null;
}

export interface InviteEmployeeRequest {
  email: string;
  fullName: string;
  title?: string;
  roles: string[];
}

export interface UserSummaryDTO {
  id: string;
  displayId?: string;
  fullName: string;
  email: string;
  title?: string;
}

export interface UserProfileResponse {
  id: string;
  displayId?: string;
  email: string;
  fullName: string;
  title?: string;
  profilePictureUrl?: string;
  manager: UserSummaryDTO | null;
  managerId?: string | null;
  reportees: UserSummaryDTO[];
  roles: string[];
  isActive: boolean;
  departmentId?: string | null;
  departmentName?: string | null;
}

export interface UpdateUserProfilePayload {
  fullName: string;
  title?: string;
  managerId?: string | null;
  isActive?: boolean;
}

export interface OrgNode {
  id: string;
  displayId?: string;
  fullName: string;
  title?: string;
  email: string;
  departmentId?: string | null;
  departmentName?: string | null;
  children?: OrgNode[];
}
