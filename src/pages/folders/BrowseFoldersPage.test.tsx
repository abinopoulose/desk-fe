import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowseFoldersPage } from './BrowseFoldersPage';
import { BrowserRouter } from 'react-router';

// Mock child components
vi.mock('../../components/folders/FolderTreeNav', () => ({
  FolderTreeNav: ({ onSelectFolder }: { onSelectFolder: (id: string) => void }) => (
    <div data-testid="folder-tree-nav">
      <button onClick={() => onSelectFolder('mock-id')}>Select Folder</button>
    </div>
  ),
}));

vi.mock('../../components/folders/FolderContents', () => ({
  FolderContents: ({ folderId }: { folderId: string }) => (
    <div data-testid="folder-contents">{folderId}</div>
  ),
}));

const mockSetSearchParams = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual as object,
    useSearchParams: () => [new URLSearchParams('?folderId=123'), mockSetSearchParams],
  };
});

describe('BrowseFoldersPage', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders components and handles folder selection', () => {
    render(
      <BrowserRouter>
        <BrowseFoldersPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('folder-tree-nav')).toBeTruthy();
    expect(screen.getByTestId('folder-contents').textContent).toBe('123');

    // Simulate selecting a folder from the tree
    fireEvent.click(screen.getByText('Select Folder'));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ folderId: 'mock-id' });
  });
  
  it('toggles mobile sidebar', () => {
    render(
      <BrowserRouter>
        <BrowseFoldersPage />
      </BrowserRouter>
    );

    // Get the first hamburger button since it might render multiple on resize/mock? Wait, the UI has only one "☰" button inside the md:hidden container.
    const toggleBtn = screen.getByText('☰');
    fireEvent.click(toggleBtn);

    // Sidebar close button should be visible/clickable
    const closeBtn = screen.getByText('✕');
    expect(closeBtn).toBeTruthy();
    
    // Close sidebar
    fireEvent.click(closeBtn);
  });
});
