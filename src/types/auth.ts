export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}
