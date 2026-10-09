import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FolderExplorerModal } from './FolderExplorerModal';
import type { FolderNodeDTO } from '../../types/folder';

describe('FolderExplorerModal', () => {
  const mockTree: FolderNodeDTO[] = [
    {
      id: 'f-1',
      name: 'IT Services',
      parentId: null,
      children: [
        {
          id: 'f-1-1',
          name: 'Hardware Support',
          parentId: 'f-1',
          children: [
            {
              id: 'f-1-1-1',
              name: 'Laptops',
              parentId: 'f-1-1',
              children: [],
            },
          ],
        },
        {
          id: 'f-1-2',
          name: 'Software Licensing',
          parentId: 'f-1',
          children: [],
        },
      ],
    },
    {
      id: 'f-2',
      name: 'Human Resources',
      parentId: null,
      children: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders root folders and breadcrumbs when opened at root', () => {
    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        treeData={mockTree}
      />
    );

    expect(screen.getByText('Choose Destination Folder')).toBeDefined();
    expect(screen.getByText('Drive')).toBeDefined();
    expect(screen.getByText('IT Services')).toBeDefined();
    expect(screen.getByText('Human Resources')).toBeDefined();
  });

  it('allows drilling down into subfolders and updates breadcrumbs', () => {
    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        treeData={mockTree}
      />
    );

    // Double click or click open on IT Services
    const openButtons = screen.getAllByTitle('Open folder');
    fireEvent.click(openButtons[0]);

    // Should now see subfolders
    expect(screen.getByText('Hardware Support')).toBeDefined();
    expect(screen.getByText('Software Licensing')).toBeDefined();

    // Breadcrumbs should now contain IT Services
    expect(screen.getByRole('button', { name: 'IT Services' })).toBeDefined();
  });

  it('allows navigating back up using the Up button', () => {
    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        currentFolderId="f-1"
        treeData={mockTree}
      />
    );

    expect(screen.getByText('Hardware Support')).toBeDefined();

    // Click up button
    const upButton = screen.getByTitle('Up one level');
    fireEvent.click(upButton);

    // Should be at root
    expect(screen.getAllByText('IT Services').length).toBeGreaterThan(0);
    expect(screen.getByText('Human Resources')).toBeDefined();
  });

  it('filters folders when search query is entered', () => {
    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        treeData={mockTree}
      />
    );

    const searchInput = screen.getByPlaceholderText('Filter or search folders...');
    fireEvent.change(searchInput, { target: { value: 'laptops' } });

    expect(screen.getByText('Laptops')).toBeDefined();
    expect(screen.queryByText('Human Resources')).toBeNull();
  });

  it('selects folder and calls onSelect with full path upon confirmation', () => {
    const onSelectMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={onCloseMock}
        onSelect={onSelectMock}
        treeData={mockTree}
      />
    );

    // Click Human Resources
    fireEvent.click(screen.getByText('Human Resources'));

    // Confirm selection
    const confirmButton = screen.getByRole('button', { name: /Select Destination/i });
    fireEvent.click(confirmButton);

    expect(onSelectMock).toHaveBeenCalledWith('f-2', 'Human Resources', 'Human Resources');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('excludes node matching excludeId', () => {
    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        treeData={mockTree}
        excludeId="f-2"
      />
    );

    expect(screen.getByText('IT Services')).toBeDefined();
    expect(screen.queryByText('Human Resources')).toBeNull();
  });

  it('closes when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <FolderExplorerModal
        isOpen={true}
        onClose={onCloseMock}
        onSelect={vi.fn()}
        treeData={mockTree}
      />
    );

    const closeBtn = screen.getByLabelText('Close folder explorer');
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
