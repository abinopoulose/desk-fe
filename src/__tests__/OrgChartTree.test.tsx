import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { OrgChartTree } from '../components/org/OrgChartTree';
import type { OrgNode } from '../types/user';

const mockData: OrgNode[] = [
  {
    id: '1',
    fullName: 'Alice Manager',
    title: 'CEO',
    email: 'alice@example.com',
    children: [
      {
        id: '2',
        fullName: 'Bob Engineer',
        title: 'CTO',
        email: 'bob@example.com',
        children: [
          {
            id: '3',
            fullName: 'Charlie Developer',
            title: 'Sr. Dev',
            email: 'charlie@example.com',
            children: []
          }
        ]
      }
    ]
  }
];

describe('OrgChartTree', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders "No hierarchy data available" when data is empty', () => {
    render(<OrgChartTree data={[]} />);
    expect(screen.getByText(/no hierarchy data available/i)).toBeInTheDocument();
  });

  it('renders the root node and its children based on default expansion', () => {
    render(<OrgChartTree data={mockData} />);
    expect(screen.getByText('Alice Manager')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('Bob Engineer')).toBeInTheDocument();
    expect(screen.getByText('CTO')).toBeInTheDocument();
  });

  it('calls onSelectUser when a node is clicked', () => {
    const handleSelect = vi.fn();
    render(<OrgChartTree data={mockData} onSelectUser={handleSelect} />);
    
    const node = screen.getByTestId('node-1');
    fireEvent.click(node);
    
    expect(handleSelect).toHaveBeenCalledWith('1');
  });

  it('toggles expansion when clicking expand/collapse button', () => {
    render(<OrgChartTree data={mockData} />);
    
    // Level 0 and 1 are expanded by default, so Bob's children (Charlie) should be visible
    expect(screen.getByText('Charlie Developer')).toBeInTheDocument();
    
    // Collapse Alice (root)
    const toggleBtn = screen.getByTestId('toggle-1');
    fireEvent.click(toggleBtn);
    
    // Bob and Charlie should now be hidden
    expect(screen.queryByText('Bob Engineer')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie Developer')).not.toBeInTheDocument();
    
    // Expand Alice again
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Bob Engineer')).toBeInTheDocument();
  });

  it('auto-expands and highlights matched nodes when filtering', () => {
    render(<OrgChartTree data={mockData} filterText="charlie" />);
    
    // Node should be rendered and expanded if there's a match down the tree
    const node = screen.getByTestId('node-3'); // Charlie's card
    expect(screen.getByText('Charlie Developer')).toBeInTheDocument();
    
    // Match styles should be applied (e.g., border-blue-500)
    expect(node.className).toContain('border-blue-500');
  });

  it('matches filter based on title', () => {
    render(<OrgChartTree data={mockData} filterText="CTO" />);
    
    const node = screen.getByTestId('node-2'); // Bob's card
    expect(node.className).toContain('border-blue-500');
  });
});
