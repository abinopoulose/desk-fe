import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ticketTypeApi } from '../api/ticketTypeApi';
import axiosInstance from '../api/axiosInstance';
import { TicketTypeSummaryDTO, TicketTypeDTO, TicketStatusDTO } from '../types/ticket';

vi.mock('../api/axiosInstance');

describe('ticketTypeApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getTicketTypes fetches data', async () => {
    const mockData: TicketTypeSummaryDTO[] = [{ id: '1', title: 'Test', departmentId: 'IT', folderPath: 'IT', isActive: true }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });
    
    const result = await ticketTypeApi.getTicketTypes(true);
    expect(axiosInstance.get).toHaveBeenCalledWith('/ticket-types', { params: { includeInactive: true } });
    expect(result).toEqual(mockData);
  });

  it('getTicketTypeById fetches data', async () => {
    const mockData: TicketTypeDTO = { id: '1', title: 'Test', departmentId: 'IT', folderId: 'folder1', formSchema: {}, isActive: true };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });
    
    const result = await ticketTypeApi.getTicketTypeById('1');
    expect(axiosInstance.get).toHaveBeenCalledWith('/ticket-types/1');
    expect(result).toEqual(mockData);
  });

  it('createTicketType posts data', async () => {
    const req = { title: 'Test', departmentId: 'IT', folderId: 'f1', formSchema: {} };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: { ...req, id: '1' } });
    
    await ticketTypeApi.createTicketType(req);
    expect(axiosInstance.post).toHaveBeenCalledWith('/ticket-types', req);
  });

  it('updateTicketType puts data', async () => {
    const req = { title: 'Test', departmentId: 'IT', folderId: 'f1', formSchema: {} };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: { ...req, id: '1' } });
    
    await ticketTypeApi.updateTicketType('1', req);
    expect(axiosInstance.put).toHaveBeenCalledWith('/ticket-types/1', req);
  });

  it('deleteTicketType deletes data', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({});
    await ticketTypeApi.deleteTicketType('1');
    expect(axiosInstance.delete).toHaveBeenCalledWith('/ticket-types/1');
  });

  it('getTicketStatuses fetches statuses', async () => {
    const mockData: TicketStatusDTO[] = [{ id: '1', name: 'Open', mappedState: 'OPEN', displayOrder: 0 }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });
    
    const result = await ticketTypeApi.getTicketStatuses('type1');
    expect(axiosInstance.get).toHaveBeenCalledWith('/ticket-types/type1/statuses');
    expect(result).toEqual(mockData);
  });

  it('createTicketStatus posts status', async () => {
    const req = { name: 'Open', mappedState: 'OPEN' as const, displayOrder: 0 };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: { ...req, id: '1' } });
    
    await ticketTypeApi.createTicketStatus('type1', req);
    expect(axiosInstance.post).toHaveBeenCalledWith('/ticket-types/type1/statuses', req);
  });

  it('updateTicketStatus puts status', async () => {
    const req = { name: 'Open', mappedState: 'OPEN' as const, displayOrder: 0 };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: { ...req, id: '1' } });
    
    await ticketTypeApi.updateTicketStatus('stat1', req);
    expect(axiosInstance.put).toHaveBeenCalledWith('/ticket-statuses/stat1', req);
  });

  it('deleteTicketStatus deletes status', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({});
    await ticketTypeApi.deleteTicketStatus('stat1');
    expect(axiosInstance.delete).toHaveBeenCalledWith('/ticket-statuses/stat1');
  });
});
