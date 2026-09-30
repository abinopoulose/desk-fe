import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFolderContents } from '../useFolderContents';
import { folderApi } from '../../api/folderApi';
import type { FolderContentsDTO } from '../../types/folder';

vi.mock('../../api/folderApi', () => ({
  folderApi: {
    getFolderContents: vi.fn(),
  },
}));

describe('useFolderContents hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches folder contents when folderId is provided', async () => {
    const mockContents: FolderContentsDTO = {
      folderId: 'f1',
      folderName: 'Root',
      subfolders: [],
      ticketTypes: [],
    };

    vi.mocked(folderApi.getFolderContents).mockResolvedValueOnce(mockContents);

    const { result } = renderHook(() => useFolderContents('f1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contents).toEqual(mockContents);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when folderId is null', async () => {
    const { result } = renderHook(() => useFolderContents(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.contents).toBeNull();
    expect(folderApi.getFolderContents).not.toHaveBeenCalled();
  });

  it('handles errors', async () => {
    vi.mocked(folderApi.getFolderContents).mockRejectedValueOnce(new Error('Folder contents error'));

    const { result } = renderHook(() => useFolderContents('f2'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load folder contents');
  });
});
