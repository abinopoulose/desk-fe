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
