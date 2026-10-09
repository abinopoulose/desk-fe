import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ArchiveBrowser } from './ArchiveBrowser';
import * as archiveHook from '../../hooks/useArchiveBrowser';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('ArchiveBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the ticketing system category browser with search bar and title', () => {
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: null,
      breadcrumbs: [],
      contents: {
        folderId: 'root',
        folderName: '/',
        subfolders: [
          { id: 'f-1', name: 'IT & Infrastructure', parentId: null, createdAt: '', updatedAt: '' },
          { id: 'f-2', name: 'HR & People Ops', parentId: null, createdAt: '', updatedAt: '' },
        ],
        ticketTypes: [],
      },
      isLoading: false,
      treeData: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      allTicketTypes: [],
      navigateToFolder: vi.fn(),
      navigateBack: vi.fn(),
      navigateToRoot: vi.fn(),
      setSearchQuery: vi.fn(),
    });

    render(<ArchiveBrowser />);

    expect(screen.getByText('Select Ticket Category')).toBeDefined();
    expect(screen.getByText('Service Catalog')).toBeDefined();
    expect(screen.getByPlaceholderText('Search ticket types, issues, or services...')).toBeDefined();
    expect(screen.getByText('IT & Infrastructure')).toBeDefined();
    expect(screen.getByText('HR & People Ops')).toBeDefined();
  });

  it('allows navigating into a folder when clicked or via keyboard', () => {
    const navigateToFolderMock = vi.fn();
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: null,
      breadcrumbs: [],
      contents: {
        folderId: 'root',
        folderName: '/',
        subfolders: [
          { id: 'f-1', name: 'Security & Access', parentId: null, createdAt: '', updatedAt: '' },
        ],
        ticketTypes: [],
      },
      isLoading: false,
      treeData: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      allTicketTypes: [],
      navigateToFolder: navigateToFolderMock,
      navigateBack: vi.fn(),
      navigateToRoot: vi.fn(),
      setSearchQuery: vi.fn(),
    });

    render(<ArchiveBrowser />);

    const folderCard = screen.getByRole('button', { name: /Open folder Security & Access/i });
    fireEvent.click(folderCard);
    expect(navigateToFolderMock).toHaveBeenCalledWith('f-1');

    // Test keyboard interaction (Enter key)
    fireEvent.keyDown(folderCard, { key: 'Enter' });
    expect(navigateToFolderMock).toHaveBeenCalledTimes(2);
  });

  it('renders ticket template cards and navigates to ticket creation on click', () => {
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: 'f-1',
      breadcrumbs: [{ id: 'f-1', name: 'Hardware Requests' }],
      contents: {
        folderId: 'f-1',
        folderName: 'Hardware Requests',
        subfolders: [],
        ticketTypes: [
          {
            id: 'tt-101',
            title: 'Laptop Replacement Request',
            description: 'Request a new laptop or peripheral device replacement',
            departmentName: 'IT Operations',
            folderPath: 'Hardware Requests',
            isActive: true,
          },
        ],
      },
      isLoading: false,
      treeData: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      allTicketTypes: [],
      navigateToFolder: vi.fn(),
      navigateBack: vi.fn(),
      navigateToRoot: vi.fn(),
      setSearchQuery: vi.fn(),
    });

    render(<ArchiveBrowser />);

    expect(screen.getByText('Laptop Replacement Request')).toBeDefined();
    expect(screen.getByText('Request a new laptop or peripheral device replacement')).toBeDefined();
    expect(screen.getByText('IT Operations')).toBeDefined();

    const caseFileCard = screen.getByRole('button', { name: /Open case file Laptop Replacement Request/i });
    fireEvent.click(caseFileCard);

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/new?typeId=tt-101');
  });

  it('renders prominent back button when inside a subfolder and triggers navigateBack', () => {
    const navigateBackMock = vi.fn();
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: 'f-2',
      breadcrumbs: [
        { id: 'f-1', name: 'IT Support' },
        { id: 'f-2', name: 'Hardware' },
      ],
      contents: {
        folderId: 'f-2',
        folderName: 'Hardware',
        subfolders: [],
        ticketTypes: [],
      },
      isLoading: false,
      treeData: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      allTicketTypes: [],
      navigateToFolder: vi.fn(),
      navigateBack: navigateBackMock,
      navigateToRoot: vi.fn(),
      setSearchQuery: vi.fn(),
    });

    render(<ArchiveBrowser />);

    const backButton = screen.getByText(/Return to IT Support/i);
    expect(backButton).toBeDefined();

    fireEvent.click(backButton);
    expect(navigateBackMock).toHaveBeenCalled();
  });

  it('renders global search results view when query is active', () => {
    const setSearchQueryMock = vi.fn();
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: null,
      breadcrumbs: [],
      contents: null,
      isLoading: false,
      treeData: [],
      searchQuery: 'laptop',
      searchResults: [
        {
          id: 'tt-99',
          title: 'Laptop Repair Form',
          description: 'Submit an issue with screen, battery, or keyboard',
          departmentId: 'dept-1',
          departmentName: 'IT Support',
          folderPath: 'Hardware / Laptops',
          isActive: true,
        },
      ],
      isSearching: true,
      allTicketTypes: [],
      navigateToFolder: vi.fn(),
      navigateBack: vi.fn(),
      navigateToRoot: vi.fn(),
      setSearchQuery: setSearchQueryMock,
    });

    render(<ArchiveBrowser />);

    expect(screen.getByText('Search Results')).toBeDefined();
    expect(screen.getByText('Laptop Repair Form')).toBeDefined();

    // Clear search button
    const clearButton = screen.getAllByRole('button', { name: /Clear search/i })[0];
    fireEvent.click(clearButton);
    expect(setSearchQueryMock).toHaveBeenCalledWith('');
  });

  it('shows clean empty state when archive folder is empty', () => {
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: 'f-empty',
      breadcrumbs: [{ id: 'f-empty', name: 'Archived Services' }],
      contents: {
        folderId: 'f-empty',
        folderName: 'Archived Services',
        subfolders: [],
        ticketTypes: [],
      },
      isLoading: false,
      treeData: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      allTicketTypes: [],
      navigateToFolder: vi.fn(),
      navigateBack: vi.fn(),
      navigateToRoot: vi.fn(),
      setSearchQuery: vi.fn(),
    });

    render(<ArchiveBrowser />);

    expect(screen.getByText('This archive is empty')).toBeDefined();
    expect(screen.getByText(/No ticket types or subcategories are currently filed/i)).toBeDefined();
  });
});
