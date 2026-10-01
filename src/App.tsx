import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import { ROUTES } from './constants';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { OrgSignupPage } from './pages/auth/OrgSignupPage';
import { SetPasswordPage } from './pages/auth/SetPasswordPage';
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
import { EmployeeManagementPage } from './pages/admin/EmployeeManagementPage';
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
          <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.AUTH.REGISTER} element={<OrgSignupPage />} />
          <Route path={ROUTES.AUTH.SET_PASSWORD} element={<SetPasswordPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<TicketListPage />} />
            <Route path={ROUTES.BROWSE} element={<BrowseFoldersPage />} />
            <Route path={ROUTES.TICKETS.NEW} element={<CreateTicketPage />} />
            <Route path={ROUTES.TICKETS.DETAILS_PATH} element={<TicketDetailsPage />} />
            <Route path={ROUTES.TICKETS.BASE} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.ADMIN.TICKET_TYPES} element={<TicketTypeAdminPage />} />
            <Route path={ROUTES.ADMIN.TICKET_TYPE_NEW} element={<TicketTypeFormPage />} />
            <Route path={ROUTES.ADMIN.TICKET_TYPE_EDIT_PATH} element={<TicketTypeFormPage />} />
            <Route path={ROUTES.ADMIN.TICKET_STATUSES_PATH} element={<TicketStatusManager />} />
            <Route path={ROUTES.ADMIN.SLA_CONFIGS} element={<SlaConfigPage />} />
            <Route path={ROUTES.ADMIN.DEPARTMENTS} element={<DepartmentAdminPage />} />
            <Route path={ROUTES.ADMIN.ROLES} element={<RoleAdminPage />} />
            <Route path={ROUTES.ADMIN.EMPLOYEES} element={<PrivilegeGate requiredPrivilege="USER_INVITE"><EmployeeManagementPage /></PrivilegeGate>} />
            <Route path={ROUTES.METRICS} element={<PrivilegeGate requiredPrivilege="METRICS_READ"><MetricsDashboardPage /></PrivilegeGate>} />
            <Route path={ROUTES.ORG_CHART} element={<OrgChartPage />} />
            <Route path={ROUTES.USERS.PROFILE_PATH} element={<UserProfilePage />} />
          </Route>
        </Routes>
      </PageErrorBoundary>
    </BrowserRouter>
  )
}

export default App;

