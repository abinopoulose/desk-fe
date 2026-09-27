export interface MetricsFilterParams {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
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

export interface TrendDataPoint {
  date: string;
  created: number;
  closed: number;
}

export interface PerformanceMetricsResponse {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  slaBreachCount: number;
  slaBreachRate: number;
  averageTatHours: number | null;
  byPriority: PriorityCount[];
  byDepartment: DepartmentCount[];
  trend: TrendDataPoint[];
}
