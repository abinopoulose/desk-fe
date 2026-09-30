import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFolderTree } from '../useFolderTree';
import { folderApi } from '../../api/folderApi';
import type { FolderNodeDTO } from '../../types/folder';

vi.mock('../../api/folderApi', () => ({
  folderApi: {
    getFolderTree: vi.fn(),
  },
}));

describe('useFolderTree hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches folder tree automatically', async () => {
    const mockTree: FolderNodeDTO[] = [{ id: 'f1', name: 'Root', parentId: null, children: [] }];
    vi.mocked(folderApi.getFolderTree).mockResolvedValueOnce(mockTree);

    const { result } = renderHook(() => useFolderTree());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.treeData).toEqual(mockTree);
    expect(result.current.error).toBeNull();
  });

  it('handles errors', async () => {
    vi.mocked(folderApi.getFolderTree).mockRejectedValueOnce(new Error('Folder tree error'));

    const { result } = renderHook(() => useFolderTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load folder tree');
  });

  it('manages expanded nodes', async () => {
    vi.mocked(folderApi.getFolderTree).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useFolderTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.toggleNode('f1');
    });

    expect(result.current.expandedNodes.has('f1')).toBe(true);

    act(() => {
      result.current.toggleNode('f1');
    });

    expect(result.current.expandedNodes.has('f1')).toBe(false);
  });
});
