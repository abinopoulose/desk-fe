export interface SlaConfigDTO {
  id: string;
  ticketTypeId: string;
  priority: number;
  resolutionMinutes: number;
  workingDays: number[]; // 1=Monday...7=Sunday
  workingHoursStart: string; // "HH:mm:ss" or "HH:mm"
  workingHoursEnd: string;
  escalationHooks: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlaConfigRequest {
  priority: number;
  resolutionMinutes: number;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  escalationHooks: Record<string, unknown> | null;
}

export type UpdateSlaConfigRequest = CreateSlaConfigRequest;
