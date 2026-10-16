import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { BrowseFoldersPage } from './BrowseFoldersPage';
import { folderApi } from '../../api/folderApi';
import { ticketTypeApi } from '../../api/ticketTypeApi';

vi.mock('../../components/auth/PrivilegeGate', () => ({
  PrivilegeGate: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../api/folderApi', () => ({
  folderApi: {
    getFolderTree: vi.fn(),
    getFolderContents: vi.fn(),
  },
}));

vi.mock('../../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketTypes: vi.fn(),
  },
}));

describe('BrowseFoldersPage Return to All Categories', () => {
  const mockTree = [
    {
      id: 'folder-1',
      name: 'IT Support',
      parentId: null,
      children: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(folderApi.getFolderTree).mockResolvedValue(mockTree);
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValue([]);
    vi.mocked(folderApi.getFolderContents).mockResolvedValue({
      folderId: 'folder-1',
      folderName: 'IT Support',
      subfolders: [],
      ticketTypes: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('navigates back to All Categories when button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/ticket-types?folderId=folder-1']}>
        <Routes>
          <Route path="/admin/ticket-types" element={<BrowseFoldersPage isAdminMode={true} />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the button to appear
    await waitFor(() => {
      expect(screen.getByText('Return to All Categories')).toBeDefined();
    });

    const button = screen.getByText('Return to All Categories').closest('button')!;
    fireEvent.click(button);

    // After clicking, folderId should be null and button should disappear
    await waitFor(() => {
      expect(screen.queryByText('Return to All Categories')).toBeNull();
    });
  });

  it('navigates back to All Categories when breadcrumb is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/ticket-types?folderId=folder-1']}>
        <Routes>
          <Route path="/admin/ticket-types" element={<BrowseFoldersPage isAdminMode={true} />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Return to All Categories')).toBeDefined();
    });

    const allCategoriesBreadcrumb = screen.getByRole('button', { name: /^all categories$/i });
    fireEvent.click(allCategoriesBreadcrumb);

    await waitFor(() => {
      expect(screen.queryByText('Return to All Categories')).toBeNull();
    });
  });
});
