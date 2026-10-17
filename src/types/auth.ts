export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  roles: string[];
  privileges?: string[];
  organizationId?: string;
  organizationName?: string;
  organizationSubdomain?: string;
  organizationSlug?: string;
  profilePictureUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
  privileges?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}



export interface CreateOrgRequest {
  name: string;
  adminEmail: string;
  adminFullName: string;
  password: string;
}

export interface SetPasswordRequest {
  token: string;
  password: string;
  confirmPassword?: string;
  terminateOtherSessions?: boolean;
}
