export interface DepartmentDTO {
  id: string;
  displayId?: string;
  name: string;
  description?: string;
  alphaTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  alphaTags?: string[];
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  alphaTags?: string[];
}

export interface MyDepartmentDTO {
  id: string;
  name: string;
  description?: string;
  alphaTags?: string[];
  myRole: 'ADMIN' | 'MEMBER';
  memberCount: number;
}

export interface DepartmentMemberDTO {
  id: string;
  departmentId: string;
  departmentName?: string;
  userId: string;
  displayId?: string;
  fullName: string;
  email: string;
  title?: string;
  profilePictureUrl?: string | null;
  role: 'ADMIN' | 'MEMBER';
  joinedAt?: string;
}

export interface AddDepartmentMemberRequest {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface UpdateDepartmentMemberRequest {
  role: 'ADMIN' | 'MEMBER';
}

export interface DepartmentMetricsDTO {
  departmentId: string;
  departmentName: string;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  slaBreachedCount: number;
  slaComplianceRate: number;
  avgResolutionMinutes: number;
}
