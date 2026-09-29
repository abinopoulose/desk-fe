import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFolders } from '../useFolders';
import { folderApi } from '../../api/folderApi';
import type { FolderNodeDTO, FolderContentsDTO } from '../../types/folder';

vi.mock('../../api/folderApi', () => ({
  folderApi: {
    getFolderTree: vi.fn(),
    getFolderContents: vi.fn(),
  },
}));

describe('useFolders hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches folder tree and contents', async () => {
    const mockTree: FolderNodeDTO[] = [{ id: 'f1', name: 'Root', parentId: null, children: [] }];
    const mockContents: FolderContentsDTO = {
      folderId: 'f1',
      folderName: 'Root',
      subfolders: [],
      ticketTypes: [],
    };

    vi.mocked(folderApi.getFolderTree).mockResolvedValueOnce(mockTree);
    vi.mocked(folderApi.getFolderContents).mockResolvedValueOnce(mockContents);

    const { result } = renderHook(() => useFolders());

    expect(result.current.data.tree).toBeNull();
    expect(result.current.data.contents).toBeNull();

    await act(async () => {
      const tree = await result.current.fetchFolderTree();
      expect(tree).toEqual(mockTree);
    });

    expect(result.current.data.tree).toEqual(mockTree);

    await act(async () => {
      const contents = await result.current.fetchFolderContents('f1');
      expect(contents).toEqual(mockContents);
    });

    expect(result.current.data.contents).toEqual(mockContents);
    expect(result.current.loading).toBe(false);
  });

  it('handles errors', async () => {
    vi.mocked(folderApi.getFolderTree).mockRejectedValueOnce(new Error('Folder tree error'));

    const { result } = renderHook(() => useFolders());

    await act(async () => {
      try {
        await result.current.fetchFolderTree();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Folder tree error');
  });
});
