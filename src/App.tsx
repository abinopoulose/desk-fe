import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OrgChartPage } from './pages/org/OrgChartPage';
import { BrowseFoldersPage } from './pages/folders/BrowseFoldersPage';
import { TicketTypeAdminPage } from './pages/admin/TicketTypeAdminPage';
import { TicketTypeFormPage } from './pages/admin/TicketTypeFormPage';
import { TicketStatusManager } from './pages/admin/TicketStatusManager';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { TicketDetailsPage } from './pages/tickets/TicketDetailsPage';
import { TicketListPage } from './pages/dashboard/TicketListPage';
import { MetricsDashboardPage } from './pages/metrics/MetricsDashboardPage';
import { PrivilegeGate } from './components/auth/PrivilegeGate';
import UserProfilePage from './pages/user/UserProfilePage';
import { SlaConfigPage } from './pages/admin/SlaConfigPage';
import { DepartmentAdminPage } from './pages/admin/DepartmentAdminPage';
import { RoleAdminPage } from './pages/admin/RoleAdminPage';
import { TenantConfigPage } from './pages/admin/TenantConfigPage';
import { PageErrorBoundary } from './components/errors/PageErrorBoundary';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <PageErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<TicketListPage />} />
            <Route path="/browse" element={<BrowseFoldersPage />} />
            <Route path="/tickets/new" element={<CreateTicketPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
            <Route path="/tickets" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/ticket-types" element={<TicketTypeAdminPage />} />
            <Route path="/admin/ticket-types/new" element={<TicketTypeFormPage />} />
            <Route path="/admin/ticket-types/:id/edit" element={<TicketTypeFormPage />} />
            <Route path="/admin/ticket-types/:id/statuses" element={<TicketStatusManager />} />
            <Route path="/admin/sla-configs" element={<SlaConfigPage />} />
            <Route path="/admin/departments" element={<DepartmentAdminPage />} />
            <Route path="/admin/roles" element={<RoleAdminPage />} />
            <Route path="/admin/tenant" element={<TenantConfigPage />} />
            <Route path="/metrics" element={<PrivilegeGate requiredPrivilege="METRICS_READ"><MetricsDashboardPage /></PrivilegeGate>} />
            <Route path="/org-chart" element={<OrgChartPage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
          </Route>
        </Routes>
      </PageErrorBoundary>
    </BrowserRouter>
  )
}

export default App;

