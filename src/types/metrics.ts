export interface MetricsFilterParams {
  departmentId?: string;
  assigneeId?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  interval?: 'DAY' | 'WEEK' | 'MONTH';
}

export interface PriorityCount {
  priority: number;
  count: number;
}

export interface DepartmentCount {
  departmentId: string;
  departmentName: string;
  count: number;
}

export interface TicketTypeBreakdownDTO {
  ticketTypeId: string;
  ticketTypeName: string;
  count: number;
  averageTatHours: number | null;
}

export interface AgentProductivityDTO {
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  profilePictureUrl?: string | null;
  assignedTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
  averageTatHours: number | null;
  slaBreachCount: number;
  escalatedCount: number;
}

export interface BacklogAgingDTO {
  lessThan24h: number;
  oneToThreeDays: number;
  threeToSevenDays: number;
  sevenToFourteenDays: number;
  moreThan14Days: number;
}

export interface TrendDataPoint {
  date: string;
  created: number;
  closed: number;
  netDelta?: number;
  averageTatHours?: number | null;
}

export interface PerformanceMetricsResponse {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  slaBreachCount: number;
  slaBreachRate: number;
  averageTatHours: number | null;
  escalatedCount?: number;
  byPriority: PriorityCount[];
  byDepartment: DepartmentCount[];
  byTicketType?: TicketTypeBreakdownDTO[];
  trend: TrendDataPoint[];
  agentProductivity?: AgentProductivityDTO[];
  backlogAging?: BacklogAgingDTO;
}
