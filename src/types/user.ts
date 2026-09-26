export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'USER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  managerId?: string;
  roles: Role[];
}
