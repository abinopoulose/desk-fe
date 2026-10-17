export interface UserSession {
  id: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
  terminatedAt?: string | null;
  isCurrent?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  terminateOtherSessions?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetTokenInfo {
  valid: boolean;
  email?: string;
  hasOtherSessions?: boolean;
  activeSessionCount?: number;
}
