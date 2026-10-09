import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useArchiveBrowser } from './useArchiveBrowser';
import { folderApi } from '../api/folderApi';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type { FolderNodeDTO } from '../types/folder';
import type { TicketTypeSummaryDTO } from '../types/ticket';

vi.mock('../api/folderApi', () => ({
  folderApi: {
    getFolderTree: vi.fn(),
    getFolderContents: vi.fn(),
  },
}));

vi.mock('../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketTypes: vi.fn(),
  },
}));

describe('useArchiveBrowser', () => {
  const mockTree: FolderNodeDTO[] = [
    {
      id: 'root-1',
      name: 'Major Crimes',
      parentId: null,
      children: [
        {
          id: 'sub-1',
          name: 'Cold Cases',
          parentId: 'root-1',
          children: [],
        },
      ],
    },
    {
      id: 'root-2',
      name: 'Forensics',
      parentId: null,
      children: [],
    },
  ];

  const mockTicketTypes: TicketTypeSummaryDTO[] = [
    {
      id: 'tt-1',
      title: 'Homicide Incident',
      description: 'Urgent investigation request',
      departmentId: 'd-1',
      departmentName: 'Criminal Investigation',
      folderPath: 'Major Crimes / Cold Cases',
      isActive: true,
    },
    {
      id: 'tt-2',
      title: 'Ballistics Analysis',
      description: 'Lab test for firearm evidence',
      departmentId: 'd-2',
      departmentName: 'Forensics',
      folderPath: 'Forensics',
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(folderApi.getFolderTree).mockResolvedValue(mockTree);
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValue(mockTicketTypes);
  });

  it('fetches folder tree and ticket types on mount, initializing at root', async () => {
    const { result } = renderHook(() => useArchiveBrowser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentFolderId).toBeNull();
    expect(result.current.treeData).toEqual(mockTree);
    expect(result.current.allTicketTypes).toEqual(mockTicketTypes);
    expect(result.current.contents?.subfolders).toHaveLength(2);
    expect(result.current.contents?.subfolders[0].name).toBe('Major Crimes');
  });

  it('navigates into a subfolder and builds breadcrumbs', async () => {
    vi.mocked(folderApi.getFolderContents).mockResolvedValue({
      folderId: 'sub-1',
      folderName: 'Cold Cases',
      subfolders: [],
      ticketTypes: [
        {
          id: 'tt-1',
          title: 'Homicide Incident',
          description: 'Urgent investigation request',
          departmentName: 'Criminal Investigation',
          folderPath: 'Major Crimes / Cold Cases',
          isActive: true,
        },
      ],
    });

    const { result } = renderHook(() => useArchiveBrowser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.navigateToFolder('sub-1');
    });

    await waitFor(() => {
      expect(result.current.currentFolderId).toBe('sub-1');
    });

    expect(result.current.breadcrumbs).toEqual([
      { id: 'root-1', name: 'Major Crimes' },
      { id: 'sub-1', name: 'Cold Cases' },
    ]);
    expect(result.current.contents?.ticketTypes).toHaveLength(1);
    expect(result.current.contents?.ticketTypes[0].title).toBe('Homicide Incident');
  });

  it('supports navigateBack to parent folder and root', async () => {
    vi.mocked(folderApi.getFolderContents).mockResolvedValue({
      folderId: 'root-1',
      folderName: 'Major Crimes',
      subfolders: [],
      ticketTypes: [],
    });

    const { result } = renderHook(() => useArchiveBrowser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.navigateToFolder('sub-1');
    });

    await waitFor(() => {
      expect(result.current.currentFolderId).toBe('sub-1');
    });

    // Go back to parent (root-1)
    act(() => {
      result.current.navigateBack();
    });

    await waitFor(() => {
      expect(result.current.currentFolderId).toBe('root-1');
    });
    expect(result.current.breadcrumbs).toEqual([{ id: 'root-1', name: 'Major Crimes' }]);

    // Go back to root
    act(() => {
      result.current.navigateBack();
    });

    await waitFor(() => {
      expect(result.current.currentFolderId).toBeNull();
    });
    expect(result.current.breadcrumbs).toEqual([]);
  });

  it('navigates directly to root using navigateToRoot', async () => {
    const { result } = renderHook(() => useArchiveBrowser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.navigateToFolder('sub-1');
    });

    act(() => {
      result.current.navigateToRoot();
    });

    expect(result.current.currentFolderId).toBeNull();
    expect(result.current.breadcrumbs).toEqual([]);
  });

  it('filters all ticket types when search query is entered', async () => {
    const { result } = renderHook(() => useArchiveBrowser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('ballistics');
    });

    expect(result.current.isSearching).toBe(true);
    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].title).toBe('Ballistics Analysis');

    // Case-insensitive description match
    act(() => {
      result.current.setSearchQuery('urgent');
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].title).toBe('Homicide Incident');
  });
});
