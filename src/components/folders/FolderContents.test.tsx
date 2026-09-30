import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FolderContents } from './FolderContents';
import { folderApi } from '../../api/folderApi';
import { BrowserRouter } from 'react-router';

vi.mock('../../api/folderApi', () => ({
  folderApi: {
    getFolderContents: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual as object,
    useNavigate: () => mockNavigate,
  };
});

describe('FolderContents', () => {
  const mockContents = {
    folderId: '1',
    folderName: 'Hardware',
    subfolders: [
      { id: '2', name: 'Laptops', parentId: '1', createdAt: '', updatedAt: '' }
    ],
    ticketTypes: [
      { id: '10', title: 'Request Laptop', description: 'desc', departmentName: 'IT', folderPath: 'Root/IT/Hardware', isActive: true }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    vi.mocked(folderApi.getFolderContents).mockReturnValue(new Promise(() => {}));
    render(
      <BrowserRouter>
        <FolderContents folderId="1" onSelectFolder={vi.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading contents...')).toBeTruthy();
  });

  it('renders error state if API fails', async () => {
    vi.mocked(folderApi.getFolderContents).mockRejectedValue(new Error('Failed'));
    render(
      <BrowserRouter>
        <FolderContents folderId="1" onSelectFolder={vi.fn()} />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Failed to load folder contents')).toBeTruthy();
    });
  });

  it('renders empty state if no folder selected', () => {
    render(
      <BrowserRouter>
        <FolderContents folderId="" onSelectFolder={vi.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Select a folder to view its contents')).toBeTruthy();
  });

  it('renders folder contents and handles clicks', async () => {
    vi.mocked(folderApi.getFolderContents).mockResolvedValue(mockContents);
    const handleSelect = vi.fn();

    render(
      <BrowserRouter>
        <FolderContents folderId="1" onSelectFolder={handleSelect} />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Breadcrumb check
      expect(screen.getByText('Root')).toBeTruthy();
      expect(screen.getAllByText('IT').length).toBeGreaterThan(0);
      expect(screen.getByText('Hardware')).toBeTruthy();
    });

    expect(screen.getByText('Laptops')).toBeTruthy();
    expect(screen.getByText('Request Laptop')).toBeTruthy();

    // Click subfolder
    fireEvent.click(screen.getByText('Laptops'));
    expect(handleSelect).toHaveBeenCalledWith('2');

    // Click ticket type
    fireEvent.click(screen.getByText('Request Laptop'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/new?typeId=10');
  });
});
