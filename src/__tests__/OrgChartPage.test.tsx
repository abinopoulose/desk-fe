import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { OrgChartPage } from '../pages/org/OrgChartPage';
import * as userApi from '../api/userApi';

vi.mock('../api/userApi', () => ({
  getOrgHierarchy: vi.fn(),
}));

const mockData = [
  {
    id: '1',
    fullName: 'Alice',
    email: 'alice@example.com',
    children: []
  }
];

describe('OrgChartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    // Return an unresolved promise to keep it in loading state
    vi.mocked(userApi.getOrgHierarchy).mockReturnValue(new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <OrgChartPage />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders data when fetch is successful', async () => {
    vi.mocked(userApi.getOrgHierarchy).mockResolvedValue(mockData);
    
    render(
      <MemoryRouter>
        <OrgChartPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('renders error message when fetch fails', async () => {
    vi.mocked(userApi.getOrgHierarchy).mockRejectedValue(new Error('Network error'));
    
    render(
      <MemoryRouter>
        <OrgChartPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('allows retrying when there is an error', async () => {
    vi.mocked(userApi.getOrgHierarchy).mockRejectedValueOnce(new Error('Network error'));
    vi.mocked(userApi.getOrgHierarchy).mockResolvedValueOnce(mockData);
    
    render(
      <MemoryRouter>
        <OrgChartPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Retry'));
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('updates filter text on input change', async () => {
    vi.mocked(userApi.getOrgHierarchy).mockResolvedValue(mockData);
    
    render(
      <MemoryRouter>
        <OrgChartPage />
      </MemoryRouter>
    );
    
    const input = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(input, { target: { value: 'bob' } });
    
    expect(input).toHaveValue('bob');
  });

  it('handles zoom controls', async () => {
    vi.mocked(userApi.getOrgHierarchy).mockResolvedValue(mockData);
    
    render(
      <MemoryRouter>
        <OrgChartPage />
      </MemoryRouter>
    );
    
    const zoomInBtn = screen.getByText('+');
    const zoomOutBtn = screen.getByText('-');
    const resetBtn = screen.getByText('Reset');
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('110%')).toBeInTheDocument();
    
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('90%')).toBeInTheDocument();
    
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
