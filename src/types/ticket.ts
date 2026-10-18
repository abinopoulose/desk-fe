export interface TicketType {
  id: string;
  folderId: string;
  departmentId: string;
  title: string;
  description?: string;
  alphaTag?: string;
  formSchema: Record<string, unknown>;
}

export interface Ticket {
  id: string;
  displayId?: string;
  title: string;
  ticketTypeId: string;
  requesterId: string;
  assigneeId?: string;
  currentStatusId: string;
  priority: string;
  formData: Record<string, unknown>;
  slaDueAt?: string;
  attachments?: string[];
}

export interface TicketTypeSummaryDTO {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  description?: string;
  alphaTag?: string;
  folderPath: string; // From requirements
  isActive: boolean;
  active?: boolean;
}

export interface TicketTypeDTO extends TicketType {
  isActive: boolean;
  active?: boolean;
  folderPath?: string;
}

export interface CreateTicketTypeRequest {
  title: string;
  description?: string;
  folderId: string;
  departmentId: string;
  alphaTag?: string;
  formSchema: Record<string, unknown>;
  isActive?: boolean;
  active?: boolean;
}

export type UpdateTicketTypeRequest = CreateTicketTypeRequest;

export interface TicketStatusDTO {
  id: string;
  name: string;
  mappedState: 'OPEN' | 'CLOSED';
  displayOrder: number;
}

export interface CreateStatusRequest {
  name: string;
  mappedState: 'OPEN' | 'CLOSED';
  displayOrder: number;
}

export type UpdateStatusRequest = CreateStatusRequest;

export interface CreateTicketRequest {
  ticketTypeId: string;
  title: string;
  priority: number;
  formData: Record<string, unknown>;
  attachments?: string[];
}

export interface FormSchemaResponse {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  folderId: string;
  alphaTag?: string;
  formSchema: Record<string, unknown>;
}

export interface TicketDTO {
  id: string;
  displayId?: string;
  title: string;
  ticketTypeId: string;
  ticketTypeTitle: string;
  requesterId: string;
  requesterName: string;
  assigneeId?: string;
  assigneeName?: string;
  currentStatusId: string;
  currentStatusName: string;
  mappedState: 'OPEN' | 'CLOSED';
  priority: number;
  formData: Record<string, unknown>;
  slaDueAt: string;
  slaBreached: boolean;
  escalated?: boolean;
  escalatedAt?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailResponse {
  id: string;
  displayId?: string;
  title: string;
  ticketType: { id: string; title: string; alphaTag?: string; formSchema?: Record<string, unknown> };
  requester: { id: string; displayId?: string; fullName: string; email: string; profilePictureUrl?: string };
  assignee?: { id: string; displayId?: string; fullName: string; email: string; profilePictureUrl?: string };
  currentStatus: { id: string; name: string; mappedState: 'OPEN' | 'CLOSED' };
  priority: number;
  formData: Record<string, unknown>;
  slaDueAt: string;
  slaBreached: boolean;
  escalated?: boolean;
  escalatedAt?: string;
  attachments?: string[];
  comments: CommentDTO[];
  history: TicketHistoryDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  ticketId: string;
  author: { id: string; displayId?: string; fullName: string; email: string; avatarUrl?: string };
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface TicketHistoryDTO {
  id: string;
  changedByUserId: string;
  changedByUserName: string;
  changedAt: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface TicketFilterParams {
  tab?: 'my' | 'assigned' | 'shared' | 'all';
  status?: string;
  mappedState?: 'OPEN' | 'CLOSED';
  priority?: number;
  requesterId?: string;
  assigneeId?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface TicketListResponse {
  tickets: TicketDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface TicketSummaryDTO {
  id: string;
  displayId?: string;
  ticketTypeTitle: string;
  departmentName: string;
  requesterName: string;
  assigneeName?: string;
  statusName: string;
  mappedState: 'OPEN' | 'CLOSED';
  priority: number;
  slaDueAt: string;
  slaBreached: boolean;
  createdAt: string;
}

export interface TicketShareDTO {
  id: string;
  ticketId: string;
  shareType: 'USER' | 'DEPARTMENT';
  targetId: string;
  targetName: string;
  targetEmail?: string;
  targetDisplayId?: string;
  sharedByUserId: string;
  sharedByUserName: string;
  createdAt: string;
}

export interface TicketAccessListDTO {
  ticketId: string;
  requester?: { id: string; displayId?: string; fullName: string; email: string } | null;
  assignee?: { id: string; displayId?: string; fullName: string; email: string } | null;
  primaryDepartment?: { id: string; name: string; displayId?: string } | null;
  sharedUsers: TicketShareDTO[];
  sharedDepartments: TicketShareDTO[];
}

export interface ShareTicketRequest {
  shareType: 'USER' | 'DEPARTMENT';
  targetId: string;
}

