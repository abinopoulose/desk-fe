import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AssigneeSearchBar } from './AssigneeSearchBar';
import type { User } from '../../types/user';

describe('AssigneeSearchBar Component', () => {
  const mockAssignee = {
    id: 'user-1',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    profilePictureUrl: 'https://example.com/alice.jpg',
  };

  const mockAvailableEmployees: User[] = [
    {
      id: 'user-1',
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      title: 'Senior Engineer',
      profilePictureUrl: 'https://example.com/alice.jpg',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'user-2',
      fullName: 'Bob Johnson',
      email: 'bob@example.com',
      title: 'Support Specialist',
      profilePictureUrl: 'https://example.com/bob.jpg',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'user-3',
      fullName: 'Charlie Brown',
      email: 'charlie@example.com',
      title: 'Product Manager',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'user-4',
      fullName: 'Diana Prince',
      email: 'diana@example.com',
      title: 'DevOps Lead',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'user-5',
      fullName: 'Evan Wright',
      email: 'evan@example.com',
      title: 'QA Engineer',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'user-6',
      fullName: 'Fiona Gallagher',
      email: 'fiona@example.com',
      title: 'Designer',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'user-7',
      fullName: 'George Clark',
      email: 'george@example.com',
      title: 'Engineering Director',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders current assignee profile picture, name, and email when closed', () => {
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={mockAssignee}
          availableAssignees={mockAvailableEmployees}
          canManage={true}
          onAssigneeChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice Smith')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    const avatarImg = screen.getByAltText('Alice Smith');
    expect(avatarImg).toBeDefined();
    expect(avatarImg.getAttribute('src')).toBe('https://example.com/alice.jpg');
    // Ensure designation is not shown
    expect(screen.queryByText('Senior Engineer')).toBeNull();
  });

  it('renders Unassigned placeholder when no assignee is selected', () => {
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={null}
          availableAssignees={mockAvailableEmployees}
          canManage={true}
          onAssigneeChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Unassigned')).toBeDefined();
    expect(screen.getByText('Click to search & assign')).toBeDefined();
  });

  it('opens Jira-style search dropdown with input on click and shows top 5 employees only', () => {
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={null}
          availableAssignees={mockAvailableEmployees}
          canManage={true}
          onAssigneeChange={vi.fn()}
        />
      </MemoryRouter>
    );

    // Click trigger button to open search
    const trigger = screen.getByRole('button', { name: /unassigned/i });
    fireEvent.click(trigger);

    // Search input should be visible
    const searchInput = screen.getByPlaceholderText('Search employees by name or email...');
    expect(searchInput).toBeDefined();

    // Verify exactly 5 employees are shown (out of 7 available)
    expect(screen.getByText('Alice Smith')).toBeDefined();
    expect(screen.getByText('Bob Johnson')).toBeDefined();
    expect(screen.getByText('Charlie Brown')).toBeDefined();
    expect(screen.getByText('Diana Prince')).toBeDefined();
    expect(screen.getByText('Evan Wright')).toBeDefined();

    // The 6th and 7th employees should NOT be rendered in the top 5
    expect(screen.queryByText('Fiona Gallagher')).toBeNull();
    expect(screen.queryByText('George Clark')).toBeNull();

    // Verify employee emails are rendered
    expect(screen.getByText('alice@example.com')).toBeDefined();
    expect(screen.getByText('bob@example.com')).toBeDefined();

    // Verify designations (titles) are strictly NOT shown
    expect(screen.queryByText('Senior Engineer')).toBeNull();
    expect(screen.queryByText('Support Specialist')).toBeNull();
    expect(screen.queryByText('Product Manager')).toBeNull();
    expect(screen.queryByText('DevOps Lead')).toBeNull();
    expect(screen.queryByText('QA Engineer')).toBeNull();
  });

  it('filters employees dynamically as the user types and caps at top 5 matches', () => {
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={null}
          availableAssignees={mockAvailableEmployees}
          canManage={true}
          onAssigneeChange={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /unassigned/i }));
    const searchInput = screen.getByPlaceholderText('Search employees by name or email...');

    // Type "fiona"
    fireEvent.change(searchInput, { target: { value: 'fiona' } });

    expect(screen.getByText('Fiona Gallagher')).toBeDefined();
    expect(screen.getByText('fiona@example.com')).toBeDefined();
    expect(screen.queryByText('Alice Smith')).toBeNull();
    // Designation still not shown
    expect(screen.queryByText('Designer')).toBeNull();
  });

  it('selects an employee on click, calls onAssigneeChange with user id, and closes popover', () => {
    const onAssigneeChange = vi.fn();
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={null}
          availableAssignees={mockAvailableEmployees}
          canManage={true}
          onAssigneeChange={onAssigneeChange}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /unassigned/i }));

    const bobOption = screen.getByRole('option', { name: /bob johnson/i });
    fireEvent.click(bobOption);

    expect(onAssigneeChange).toHaveBeenCalledWith('user-2');
    // Popover closes, search input disappears
    expect(screen.queryByPlaceholderText('Search employees by name or email...')).toBeNull();
  });

  it('selects Unassigned to clear the ticket assignee', () => {
    const onAssigneeChange = vi.fn();
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={mockAssignee}
          availableAssignees={mockAvailableEmployees}
          canManage={true}
          onAssigneeChange={onAssigneeChange}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /alice smith/i }));

    const unassignOption = screen.getByRole('option', { name: /unassigned/i });
    fireEvent.click(unassignOption);

    expect(onAssigneeChange).toHaveBeenCalledWith(null);
  });

  it('renders read-only display when canManage is false', () => {
    render(
      <MemoryRouter>
        <AssigneeSearchBar
          assignee={mockAssignee}
          availableAssignees={mockAvailableEmployees}
          canManage={false}
          onAssigneeChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice Smith')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    // No interactive button to open search
    expect(screen.queryByRole('button')).toBeNull();
  });
});
