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
