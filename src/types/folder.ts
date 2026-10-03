export interface FolderNodeDTO {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNodeDTO[];
}

export interface FolderDTO {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketTypeSummaryDTO {
  id: string;
  title: string;
  description: string;
  departmentName: string;
  folderPath: string;
  isActive: boolean;
  active?: boolean;
}

export interface FolderContentsDTO {
  folderId: string;
  folderName: string;
  subfolders: FolderDTO[];
  ticketTypes: TicketTypeSummaryDTO[];
}
