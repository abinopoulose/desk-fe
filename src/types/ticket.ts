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
