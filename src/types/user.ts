export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'USER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  managerId?: string;
  roles: Role[];
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
  manager: UserSummaryDTO | null;
  reportees: UserSummaryDTO[];
  roles: string[];
  isActive: boolean;
}

export interface OrgNode {
  id: string;
  fullName: string;
  title?: string;
  email: string;
  children?: OrgNode[];
}
