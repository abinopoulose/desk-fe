import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FolderTreeNav } from './FolderTreeNav';
import { folderApi } from '../../api/folderApi';
import { BrowserRouter } from 'react-router';

vi.mock('../../api/folderApi', () => ({
  folderApi: {
    getFolderTree: vi.fn(),
  },
}));

describe('FolderTreeNav', () => {
  const mockTreeData = [
    {
      id: '1',
      name: 'Root Folder',
      parentId: null,
      children: [
        {
          id: '2',
          name: 'Child Folder',
          parentId: '1',
          children: []
        }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    vi.mocked(folderApi.getFolderTree).mockReturnValue(new Promise(() => {}));
    render(
      <BrowserRouter>
        <FolderTreeNav onSelectFolder={vi.fn()} activeFolderId={null} />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading folders...')).toBeTruthy();
  });

  it('renders error state if API fails', async () => {
    vi.mocked(folderApi.getFolderTree).mockRejectedValue(new Error('Failed'));
    render(
      <BrowserRouter>
        <FolderTreeNav onSelectFolder={vi.fn()} activeFolderId={null} />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Failed to load folder tree')).toBeTruthy();
    });
  });

  it('renders folder tree and handles clicks', async () => {
    vi.mocked(folderApi.getFolderTree).mockResolvedValue(mockTreeData);
    const handleSelect = vi.fn();
    
    render(
      <BrowserRouter>
        <FolderTreeNav onSelectFolder={handleSelect} activeFolderId="1" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Root Folder')).toBeTruthy();
    });

    // Toggle child visibility
    const toggleIcon = screen.getByText('▶');
    fireEvent.click(toggleIcon);

    expect(screen.getByText('Child Folder')).toBeTruthy();

    // Select child folder
    fireEvent.click(screen.getByText('Child Folder'));
    expect(handleSelect).toHaveBeenCalledWith('2');
  });
});
