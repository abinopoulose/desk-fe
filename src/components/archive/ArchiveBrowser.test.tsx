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

  it('renders the detective archive atmosphere with search bar and title', () => {
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: null,
      breadcrumbs: [],
      contents: {
        folderId: 'root',
        folderName: '/',
        subfolders: [
          { id: 'f-1', name: 'Homicide & Felonies', parentId: null, createdAt: '', updatedAt: '' },
          { id: 'f-2', name: 'Cyber Crimes', parentId: null, createdAt: '', updatedAt: '' },
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

    expect(screen.getByText('Case Archives')).toBeDefined();
    expect(screen.getByText('Select a case file to open a new investigation...')).toBeDefined();
    expect(screen.getByPlaceholderText('Search all case files...')).toBeDefined();
    expect(screen.getByText('Homicide & Felonies')).toBeDefined();
    expect(screen.getByText('Cyber Crimes')).toBeDefined();
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
          { id: 'f-1', name: 'Internal Affairs', parentId: null, createdAt: '', updatedAt: '' },
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

    const folderCard = screen.getByRole('button', { name: /Open folder Internal Affairs/i });
    fireEvent.click(folderCard);
    expect(navigateToFolderMock).toHaveBeenCalledWith('f-1');

    // Test keyboard interaction (Enter key)
    fireEvent.keyDown(folderCard, { key: 'Enter' });
    expect(navigateToFolderMock).toHaveBeenCalledTimes(2);
  });

  it('renders case file cards and navigates to ticket creation on click', () => {
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: 'f-1',
      breadcrumbs: [{ id: 'f-1', name: 'Cold Cases' }],
      contents: {
        folderId: 'f-1',
        folderName: 'Cold Cases',
        subfolders: [],
        ticketTypes: [
          {
            id: 'tt-101',
            title: 'Unsolved Missing Persons Dossier',
            description: 'Escalate historical disappearance case file',
            departmentName: 'Detectives Division',
            folderPath: 'Cold Cases',
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

    expect(screen.getByText('Unsolved Missing Persons Dossier')).toBeDefined();
    expect(screen.getByText('Escalate historical disappearance case file')).toBeDefined();
    expect(screen.getByText('Detectives Division')).toBeDefined();
    expect(screen.getByText('Case File')).toBeDefined();

    const caseFileCard = screen.getByRole('button', { name: /Open case file Unsolved Missing Persons Dossier/i });
    fireEvent.click(caseFileCard);

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/new?typeId=tt-101');
  });

  it('renders prominent back button when inside a subfolder and triggers navigateBack', () => {
    const navigateBackMock = vi.fn();
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: 'f-2',
      breadcrumbs: [
        { id: 'f-1', name: 'Records Room' },
        { id: 'f-2', name: 'Vault 42' },
      ],
      contents: {
        folderId: 'f-2',
        folderName: 'Vault 42',
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

    const backButton = screen.getByText(/Return to Vault 42/i);
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
      searchQuery: 'stolen',
      searchResults: [
        {
          id: 'tt-99',
          title: 'Stolen Artifact Report',
          description: 'High value museum theft investigation',
          departmentId: 'dept-1',
          departmentName: 'Special Crimes',
          folderPath: 'Archives / Theft',
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

    expect(screen.getByText('Search Results (1)')).toBeDefined();
    expect(screen.getByText('Stolen Artifact Report')).toBeDefined();

    // Clear search button
    const clearButton = screen.getByRole('button', { name: /Clear search/i });
    fireEvent.click(clearButton);
    expect(setSearchQueryMock).toHaveBeenCalledWith('');
  });

  it('shows atmospheric empty state when archive is empty', () => {
    vi.spyOn(archiveHook, 'useArchiveBrowser').mockReturnValue({
      currentFolderId: 'f-empty',
      breadcrumbs: [{ id: 'f-empty', name: 'Archived 1982' }],
      contents: {
        folderId: 'f-empty',
        folderName: 'Archived 1982',
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
    expect(screen.getByText(/The trail goes cold here/i)).toBeDefined();
  });
});
