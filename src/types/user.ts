export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ADMIN' | 'AGENT' | 'USER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  profilePictureUrl?: string;
  managerId?: string;
  roles: Role[];
  status?: 'ACTIVE' | 'PENDING';
}

export interface InviteEmployeeRequest {
  email: string;
  fullName: string;
  title?: string;
  roles: string[];
}

export interface UserSummaryDTO {
  id: string;
  fullName: string;
  email: string;
  title?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  profilePictureUrl?: string;
  manager: UserSummaryDTO | null;
  managerId?: string | null;
  reportees: UserSummaryDTO[];
  roles: string[];
  isActive: boolean;
}

export interface UpdateUserProfilePayload {
  fullName: string;
  title?: string;
  managerId?: string | null;
  isActive?: boolean;
}

export interface OrgNode {
  id: string;
  fullName: string;
  title?: string;
  email: string;
  children?: OrgNode[];
}
