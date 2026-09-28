export interface TenantConfigDTO {
  id: string;
  allowedDomains: string[];
  superAdminEmail: string;
}

export interface UpdateTenantConfigRequest {
  allowedDomains: string[];
  superAdminEmail: string;
}
