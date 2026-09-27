export interface TicketType {
  id: string;
  folderId: string;
  departmentId: string;
  title: string;
  description?: string;
  formSchema: Record<string, unknown>;
}

export interface Ticket {
  id: string;
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
  folderPath: string; // From requirements
  isActive: boolean;
}

export interface TicketTypeDTO extends TicketType {
  isActive: boolean;
  folderPath?: string;
}

export interface CreateTicketTypeRequest {
  title: string;
  description?: string;
  folderId: string;
  departmentId: string;
  formSchema: Record<string, unknown>;
  isActive?: boolean;
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
  formSchema: Record<string, unknown>;
}

export interface TicketDTO {
  id: string;
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
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailResponse {
  id: string;
  ticketType: { id: string; title: string };
  requester: { id: string; fullName: string; email: string };
  assignee?: { id: string; fullName: string; email: string };
  currentStatus: { id: string; name: string; mappedState: 'OPEN' | 'CLOSED' };
  priority: number;
  formData: Record<string, unknown>;
  slaDueAt: string;
  slaBreached: boolean;
  attachments?: string[];
  comments: CommentDTO[];
  history: TicketHistoryDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  ticketId: string;
  author: { id: string; fullName: string; email: string };
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
  tab?: 'my' | 'assigned' | 'all';
  status?: 'OPEN' | 'CLOSED';
  priority?: number;
  requesterId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
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
