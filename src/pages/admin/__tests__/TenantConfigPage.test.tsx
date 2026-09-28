import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TenantConfigPage } from '../TenantConfigPage';
import { tenantApi } from '../../../api/tenantApi';
import { useAuthStore } from '../../../store/authStore';
import { BrowserRouter } from 'react-router';
import type { TenantConfigDTO } from '../../../types/tenant';

vi.mock('../../../api/tenantApi');
vi.mock('../../../store/authStore');

describe('TenantConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue(['TENANT_MANAGE']);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders tenant config data', async () => {
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValue({
      id: 'tenant-1',
      allowedDomains: ['example.com', 'test.com'],
      superAdminEmail: 'admin@example.com',
    } as TenantConfigDTO);

    render(
      <BrowserRouter>
        <TenantConfigPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
  });

  it('allows adding and removing domains', async () => {
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValue({
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    } as TenantConfigDTO);

    render(
      <BrowserRouter>
        <TenantConfigPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g., company.com');
    const addButton = screen.getByText('Add Domain');

    fireEvent.change(input, { target: { value: 'newdomain.com' } });
    fireEvent.click(addButton);

    expect(screen.getByText('newdomain.com')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
    // One for example.com, one for newdomain.com
    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog on save', async () => {
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValue({
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    } as TenantConfigDTO);

    render(
      <BrowserRouter>
        <TenantConfigPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    expect(screen.getByText('Yes, Save Changes')).toBeInTheDocument();

    vi.mocked(tenantApi.updateTenantConfig).mockResolvedValue({
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    } as TenantConfigDTO);

    fireEvent.click(screen.getByText('Yes, Save Changes'));

    await waitFor(() => {
      expect(tenantApi.updateTenantConfig).toHaveBeenCalledWith({
        allowedDomains: ['example.com'],
        superAdminEmail: 'admin@example.com',
      });
    });
  });
});
